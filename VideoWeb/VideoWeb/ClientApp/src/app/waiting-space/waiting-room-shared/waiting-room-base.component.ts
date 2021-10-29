import { Directive, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Guid } from 'guid-typescript';
import { Subscription } from 'rxjs';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    AllowedEndpointResponse,
    ConferenceResponse,
    ConferenceStatus,
    ConsultationAnswer,
    EndpointStatus,
    LinkType,
    LoggedParticipantResponse,
    ParticipantResponse,
    ParticipantResponseVho,
    ParticipantStatus,
    Role,
    RoomSummaryResponse,
    SharedParticipantRoom,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { EndpointStatusMessage } from 'src/app/services/models/EndpointStatusMessage';
import { HearingLayoutChanged } from 'src/app/services/models/hearing-layout-changed';
import { HearingTransfer, TransferDirection } from 'src/app/services/models/hearing-transfer';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { HeartbeatModelMapper } from 'src/app/shared/mappers/heartbeat-model-mapper';
import { Hearing } from 'src/app/shared/models/hearing';
import { Participant } from 'src/app/shared/models/participant';
import { ParticipantsUpdatedMessage } from 'src/app/shared/models/participants-updated-message';
import { Room } from 'src/app/shared/models/room';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { HearingRole } from '../models/hearing-role-model';
import {
    CallError,
    CallSetup,
    ConnectedCall,
    ConnectedPresentation,
    DisconnectedCall,
    DisconnectedPresentation,
    Presentation
} from '../models/video-call-models';
import { PrivateConsultationRoomControlsComponent } from '../private-consultation-room-controls/private-consultation-room-controls.component';
import { ConsultationInvitation, ConsultationInvitationService } from '../services/consultation-invitation.service';
import { NotificationSoundsService } from '../services/notification-sounds.service';
import { NotificationToastrService } from '../services/notification-toastr.service';
import { RoomClosingToastrService } from '../services/room-closing-toast.service';
import { VideoCallService } from '../services/video-call.service';

@Directive()
export abstract class WaitingRoomBaseDirective {
    maxBandwidth = null;
    audioOnly: boolean;
    hearingStartingAnnounced: boolean;
    privateConsultationAccordianExpanded = false;
    loadingData: boolean;
    errorCount: number;
    hearing: Hearing;
    participant: ParticipantResponse;
    conference: ConferenceResponse;
    participantEndpoints: AllowedEndpointResponse[] = [];
    conferenceRooms: Room[] = [];

    eventHubSubscription$ = new Subscription();
    videoCallSubscription$ = new Subscription();
    clockSubscription$: Subscription = new Subscription();
    currentTime: Date;

    stream: MediaStream | URL;
    connected: boolean;
    outgoingStream: MediaStream | URL;
    presentationStream: MediaStream | URL;
    streamInMain = false;

    showVideo: boolean;
    isTransferringIn: boolean;
    isPrivateConsultation: boolean;
    isAdminConsultation: boolean;
    showConsultationControls: boolean;
    displayDeviceChangeModal: boolean;
    displayStartPrivateConsultationModal: boolean;
    displayJoinPrivateConsultationModal: boolean;
    conferenceStartedBy: string;
    dualHostHasSignalledToJoinHearing = false;

    panelTypes = ['Participants', 'Chat'];
    panelStates = {
        Participants: true,
        Chat: false
    };

    CALL_TIMEOUT = 31000; // 31 seconds
    callbackTimeout: NodeJS.Timer;
    private readonly loggerPrefix = '[WR] -';
    loggedInUser: LoggedParticipantResponse;
    linkedParticipantRoom: SharedParticipantRoom;

    @ViewChild('incomingFeed', { static: false }) videoStream: ElementRef<HTMLVideoElement>;
    @ViewChild('roomTitleLabel', { static: false }) roomTitleLabel: ElementRef<HTMLDivElement>;
    @ViewChild('hearingControls', { static: false }) hearingControls: PrivateConsultationRoomControlsComponent;
    countdownComplete: boolean;

    protected constructor(
        protected route: ActivatedRoute,
        protected videoWebService: VideoWebService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected errorService: ErrorService,
        protected heartbeatMapper: HeartbeatModelMapper,
        protected videoCallService: VideoCallService,
        protected deviceTypeService: DeviceTypeService,
        protected router: Router,
        protected consultationService: ConsultationService,
        protected notificationSoundsService: NotificationSoundsService,
        protected notificationToastrService: NotificationToastrService,
        protected roomClosingToastrService: RoomClosingToastrService,
        protected clockService: ClockService,
        protected consultationInvitiationService: ConsultationInvitationService
    ) {
        this.isAdminConsultation = false;
        this.loadingData = true;
        this.showVideo = false;
        this.showConsultationControls = false;
        this.isPrivateConsultation = false;
        this.errorCount = 0;
    }

    isParticipantInCorrectWaitingRoomState(): boolean {
        return (
            this.connected &&
            this.participant.status === ParticipantStatus.Available &&
            (!this.participant.current_room || this.participant.current_room.label === 'WaitingRoom')
        );
    }

    get conferenceId(): string {
        if (this.conference) {
            return this.conference.id;
        }
        return this.route.snapshot.paramMap.get('conferenceId');
    }

    get numberOfJudgeOrJOHsInConsultation(): number {
        return this.conference.participants.filter(
            x =>
                (x.role === Role.Judge || x.role === Role.JudicialOfficeHolder) &&
                x.status === ParticipantStatus.InConsultation &&
                x.current_room?.label.toLowerCase().startsWith('judgejohconsultationroom')
        ).length;
    }

    getLoggedParticipant(): ParticipantResponse {
        return this.conference.participants.find(x => x.id === this.loggedInUser.participant_id);
    }

    stringToTranslateId(str: string) {
        return str.replace(/\s/g, '-').toLowerCase();
    }

    togglePanel(panelName: string) {
        const newState = !this.panelStates[panelName];
        if (newState) {
            this.panelTypes.forEach(pt => {
                this.panelStates[pt] = false;
            });
        }

        this.panelStates[panelName] = newState;
    }

    async getConference(): Promise<void> {
        try {
            const data = await this.videoWebService.getConferenceById(this.conferenceId);
            this.errorCount = 0;
            this.loadingData = false;
            this.countdownComplete = data.status === ConferenceStatus.InSession;
            this.hearing = new Hearing(data);
            this.conference = this.hearing.getConference();
            this.videoWebService.getAllowedEndpointsForConference(this.conferenceId).then((endpoints: AllowedEndpointResponse[]) => {
                this.participantEndpoints = endpoints;
            });

            this.participant = this.getLoggedParticipant();
            this.logger.debug(`${this.loggerPrefix} Getting conference details`, {
                conference: this.conferenceId,
                participant: this.participant.id
            });
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} There was an error getting a conference ${this.conferenceId}`, error, {
                conference: this.conferenceId
            });
            this.loadingData = false;
            this.errorService.handleApiError(error);
        }
    }

    async getConferenceClosedTime(conferenceId: string): Promise<void> {
        try {
            this.conference = await this.videoWebService.getConferenceById(conferenceId);
            this.hearing = new Hearing(this.conference);
            this.participant = this.getLoggedParticipant();

            this.logger.info(`${this.loggerPrefix} Conference closed.`, {
                conference: this.conferenceId,
                participant: this.participant.id
            });
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} There was an error getting a conference when checking closed time`, error, {
                conference: this.conferenceId,
                participant: this.participant.id
            });
        }
    }

    getCaseNameAndNumber() {
        return `${this.conference.case_name}: ${this.conference.case_number}`;
    }

    onLinkedParticiantAcceptedConsultationInvite(roomLabel: string, id: string) {
        const invitation = this.consultationInvitiationService.getInvitation(roomLabel);
        if (!invitation.invitationId) {
            return;
        }

        invitation.linkedParticipantStatuses[id] = true;

        if (invitation.answer === ConsultationAnswer.Accepted) {
            this.createOrUpdateWaitingOnLinkedParticipantsNotification(invitation);
        }
    }

    onLinkedParticiantRejectedConsultationInvite(linkedParticipant: ParticipantResponse, consulationRoomLabel: string) {
        const invitation = this.consultationInvitiationService.getInvitation(consulationRoomLabel);
        if (!invitation.invitationId) {
            return;
        }

        if (invitation.activeToast) {
            invitation.activeToast.declinedByThirdParty = true;
            invitation.activeToast.remove();
        }

        this.consultationInvitiationService.linkedParticipantRejectedInvitation(consulationRoomLabel, linkedParticipant.id);

        invitation.activeToast = this.notificationToastrService.showConsultationRejectedByLinkedParticipant(
            this.conferenceId,
            consulationRoomLabel,
            linkedParticipant.display_name,
            invitation.invitedByName,
            this.participant.status === ParticipantStatus.InHearing
        );
    }

    onTransferingToConsultation(roomLabel: string) {
        this.consultationInvitiationService.removeInvitation(roomLabel);
    }

    onConsultationRejected(roomLabel: string) {
        this.consultationInvitiationService.removeInvitation(roomLabel);
    }

    startEventHubSubscribers() {
        this.logger.debug(`${this.loggerPrefix} Subscribing to conference status changes...`);
        this.eventHubSubscription$.add(
            this.eventService.getHearingStatusMessage().subscribe(message => {
                this.handleConferenceStatusChange(message);
                this.updateShowVideo();
            })
        );

        this.logger.debug(`${this.loggerPrefix} Subscribing to participant status changes...`);
        this.eventHubSubscription$.add(
            this.eventService.getParticipantStatusMessage().subscribe(message => {
                this.handleParticipantStatusChange(message);
                this.updateShowVideo();
            })
        );

        this.logger.debug(`${this.loggerPrefix} Subscribing to endpoint status changes...`);
        this.eventHubSubscription$.add(
            this.eventService.getEndpointStatusMessage().subscribe(message => {
                this.handleEndpointStatusChange(message);
                this.updateShowVideo();
            })
        );

        this.logger.debug(`${this.loggerPrefix} Subscribing to ConsultationRequestResponseMessage`);
        this.eventHubSubscription$.add(
            this.eventService.getConsultationRequestResponseMessage().subscribe(async message => {
                if (message.answer) {
                    if (message.requestedFor === this.participant.id) {
                        await this.handleMyConsultationResponse(
                            message.answer,
                            message.requestedFor,
                            message.responseInitiatorId,
                            message.roomLabel
                        );
                    } else {
                        this.handleLinkedParticipantConsultationResponse(
                            message.answer,
                            message.requestedFor,
                            message.responseInitiatorId,
                            message.roomLabel
                        );
                    }
                }
            })
        );

        this.logger.debug(`${this.loggerPrefix} Subscribing to RequestedConsultationMessage`);
        this.eventHubSubscription$.add(
            this.eventService.getRequestedConsultationMessage().subscribe(message => {
                const requestedFor = this.resolveParticipant(message.requestedFor);
                if (requestedFor.id === this.participant.id && this.participant.status !== ParticipantStatus.InHearing) {
                    // A request for you to join a consultation room
                    this.logger.debug(`${this.loggerPrefix} Recieved RequestedConsultationMessage`);

                    const requestedBy = this.resolveParticipant(message.requestedBy);
                    const roomParticipants = this.findParticipantsInRoom(message.roomLabel).map(x => new Participant(x));
                    const roomEndpoints = this.findEndpointsInRoom(message.roomLabel);

                    const invitation = this.consultationInvitiationService.getInvitation(message.roomLabel);
                    invitation.invitationId = message.invitationId;
                    invitation.invitedByName = requestedBy.displayName;

                    // if the invitation has already been accepted; resend the response with the updated invitation id
                    if (invitation.answer === ConsultationAnswer.Accepted) {
                        this.consultationService.respondToConsultationRequest(
                            message.conferenceId,
                            message.invitationId,
                            message.requestedBy,
                            message.requestedFor,
                            invitation.answer,
                            message.roomLabel
                        );
                    }

                    if (invitation.answer !== ConsultationAnswer.Accepted) {
                        invitation.answer = ConsultationAnswer.None;
                        const consultationInviteToast = this.notificationToastrService.showConsultationInvite(
                            message.roomLabel,
                            message.conferenceId,
                            invitation,
                            requestedBy,
                            requestedFor,
                            roomParticipants,
                            roomEndpoints,
                            this.participant.status !== ParticipantStatus.Available
                        );

                        if (consultationInviteToast) {
                            invitation.activeToast = consultationInviteToast;
                        }
                    }

                    for (const linkedParticipant of this.participant.linked_participants) {
                        if (invitation.linkedParticipantStatuses[linkedParticipant.linked_id] === undefined) {
                            invitation.linkedParticipantStatuses[linkedParticipant.linked_id] = false;
                        }
                    }
                }
            })
        );

        this.logger.debug(`${this.loggerPrefix} Subscribing to EventHub disconnects`);
        this.eventHubSubscription$.add(
            this.eventService.getServiceDisconnected().subscribe(async attemptNumber => {
                await this.handleEventHubDisconnection(attemptNumber);
            })
        );

        this.logger.debug(`${this.loggerPrefix} Subscribing to EventHub room updates`);
        this.eventHubSubscription$.add(
            this.eventService.getRoomUpdate().subscribe(async room => {
                const existingRoom = this.conferenceRooms.find(r => r.label === room.label);
                if (existingRoom) {
                    existingRoom.locked = room.locked;
                    this.conference.participants
                        .filter(p => p.current_room?.label === existingRoom.label)
                        .forEach(p => (p.current_room.locked = existingRoom.locked));
                    this.conference.endpoints
                        .filter(p => p.current_room?.label === existingRoom.label)
                        .forEach(p => (p.current_room.locked = existingRoom.locked));
                } else {
                    this.conferenceRooms.push(room);
                }
            })
        );

        this.logger.debug(`${this.loggerPrefix} Subscribing to EventHub room transfer`);
        this.eventHubSubscription$.add(
            this.eventService.getRoomTransfer().subscribe(async roomTransfer => {
                const participant = this.conference.participants.find(p => p.id === roomTransfer.participant_id);
                const endpoint = this.conference.endpoints.find(p => p.id === roomTransfer.participant_id);

                if (participant) {
                    if (roomTransfer.to_room.toLowerCase().indexOf('consultation') >= 0) {
                        const room = this.conferenceRooms.find(r => r.label === roomTransfer.to_room);
                        participant.current_room = room
                            ? new RoomSummaryResponse(room)
                            : new RoomSummaryResponse({ label: roomTransfer.to_room });
                    } else {
                        participant.current_room = null;
                    }
                } else if (endpoint) {
                    if (roomTransfer.to_room.toLowerCase().indexOf('consultation') >= 0) {
                        const room = this.conferenceRooms.find(r => r.label === roomTransfer.to_room);
                        endpoint.current_room = room
                            ? new RoomSummaryResponse(room)
                            : new RoomSummaryResponse({ label: roomTransfer.to_room });
                    } else {
                        endpoint.current_room = null;
                    }
                }

                this.logger.info(
                    `${this.loggerPrefix} participant (${roomTransfer.participant_id}) transfered from ${roomTransfer.from_room} to ${roomTransfer.to_room} - Conference: ${this.conferenceId}`,
                    {
                        message: roomTransfer,
                        currentParticipantState: participant
                    }
                );
            })
        );

        this.logger.debug(`${this.loggerPrefix} Subscribing to EventHub reconnects`);
        this.eventHubSubscription$.add(
            this.eventService.getServiceConnected().subscribe(async () => {
                this.logger.info(`${this.loggerPrefix} EventHub re-connected`, {
                    conference: this.conferenceId,
                    participant: this.participant.id
                });
                await this.callAndUpdateShowVideo();
            })
        );

        this.logger.debug('[WR] - Subscribing to hearing transfer message');
        this.eventHubSubscription$.add(
            this.eventService.getHearingTransfer().subscribe(async message => {
                this.handleHearingTransferChange(message);
                this.updateShowVideo();
            })
        );

        this.logger.debug('[WR] - Subscribing to countdown complete message');
        this.eventHubSubscription$.add(
            this.eventService.getHearingCountdownCompleteMessage().subscribe(async conferenceId => {
                this.handleCountdownCompleteMessage(conferenceId);
                this.updateShowVideo();
            })
        );

        this.logger.debug('[WR] - Subscribing to participants update complete message');
        this.eventHubSubscription$.add(
            this.eventService.getParticipantsUpdated().subscribe(async participantsUpdatedMessage => {
                this.handleParticipantsUpdatedMessage(participantsUpdatedMessage);
            })
        );

        this.logger.debug('[WR] - Subscribing to hearing layout update complete message');
        this.eventHubSubscription$.add(
            this.eventService.getHearingLayoutChanged().subscribe(async hearingLayout => {
                this.handleHearingLayoutUpdatedMessage(hearingLayout);
            })
        );
    }

    resolveParticipant(participantId: any): Participant {
        if (participantId === Guid.EMPTY) {
            return new Participant(new ParticipantResponseVho({ display_name: 'a Video Hearings Officer' }));
        } else {
            const participant = this.findParticipant(participantId);

            if (participant) {
                return new Participant(participant);
            } else {
                this.logger.warn(`${this.loggerPrefix} Could NOT find the requested by participant`, participantId);
                return;
            }
        }
    }

    private handleLinkedParticipantConsultationResponse(
        answer: ConsultationAnswer,
        requestedFor: string,
        responseInitiatorId: string,
        roomLabel: string
    ) {
        if (requestedFor === responseInitiatorId) {
            if (this.isLinkedParticipant(requestedFor)) {
                const linkedParticipant = this.findParticipant(requestedFor);

                if (answer === ConsultationAnswer.Accepted || answer === ConsultationAnswer.Transferring) {
                    this.onLinkedParticiantAcceptedConsultationInvite(roomLabel, linkedParticipant.id);
                } else {
                    this.onLinkedParticiantRejectedConsultationInvite(linkedParticipant, roomLabel);
                }
            }
        }
    }

    private isLinkedParticipant(requestedFor: string): boolean {
        return !!this.participant.linked_participants.find(linkedParticipant => requestedFor === linkedParticipant.linked_id);
    }

    private async handleMyConsultationResponse(
        answer: ConsultationAnswer,
        requestedFor: string,
        responseInitiatorId: string,
        roomLabel: string
    ) {
        if (answer === ConsultationAnswer.Accepted && requestedFor === responseInitiatorId) {
            await this.onConsultationAccepted(roomLabel);
        } else if (answer === ConsultationAnswer.Transferring) {
            this.onTransferingToConsultation(roomLabel);
        } else if (requestedFor === responseInitiatorId) {
            this.onConsultationRejected(roomLabel);
        }
    }

    protected findParticipant(participantId: string): ParticipantResponse {
        return this.conference.participants.find(x => x.id === participantId);
    }

    protected findParticipantsInRoom(roomLabel: string): ParticipantResponse[] {
        return this.conference.participants.filter(x => x.current_room?.label === roomLabel);
    }

    protected findEndpointsInRoom(roomLabel: string): VideoEndpointResponse[] {
        return this.conference.endpoints.filter(x => x.current_room?.label === roomLabel);
    }

    async onConsultationAccepted(roomLabel: string) {
        this.displayStartPrivateConsultationModal = false;
        this.displayJoinPrivateConsultationModal = false;
        this.privateConsultationAccordianExpanded = false;

        if (this.displayDeviceChangeModal) {
            this.logger.debug(`${this.loggerPrefix} Participant accepted a consultation. Closing change device modal.`);
            this.displayDeviceChangeModal = false;
        }
        const invitation = this.consultationInvitiationService.getInvitation(roomLabel);
        if (invitation.answer === ConsultationAnswer.Rejected) {
            return;
        }

        invitation.answer = ConsultationAnswer.Accepted;

        this.createOrUpdateWaitingOnLinkedParticipantsNotification(invitation);
    }

    createOrUpdateWaitingOnLinkedParticipantsNotification(invitation: ConsultationInvitation) {
        const waitingOnLinkedParticipants: string[] = [];
        for (const linkedParticipantId in invitation.linkedParticipantStatuses) {
            if (invitation.linkedParticipantStatuses.hasOwnProperty(linkedParticipantId)) {
                if (!invitation.linkedParticipantStatuses[linkedParticipantId]) {
                    waitingOnLinkedParticipants.push(this.findParticipant(linkedParticipantId)?.display_name);
                }
            }
        }

        if (invitation.activeToast) {
            invitation.activeToast.remove();
            invitation.activeToast = null;
        }

        if (waitingOnLinkedParticipants.length > 0) {
            invitation.activeToast = this.notificationToastrService.showWaitingForLinkedParticipantsToAccept(
                waitingOnLinkedParticipants,
                invitation.invitedByName,
                this.participant.status === ParticipantStatus.InHearing
            );
        }
    }

    async handleEventHubDisconnection(reconnectionAttempt: number) {
        this.disconnect();

        const logPayload = {
            conference: this.conferenceId,
            participant: this.participant.id,
            connectionAttempt: reconnectionAttempt
        };
        if (reconnectionAttempt < 7) {
            this.logger.debug(`${this.loggerPrefix} EventHub disconnection`, logPayload);
            try {
                await this.getConference();
                this.updateShowVideo();
            } catch (error) {
                this.logger.warn(`${this.loggerPrefix} Failed to recover from disconnection`, logPayload);
                this.errorService.handleApiError(error);
            }
        }
    }

    get isSupportedBrowserForNetworkHealth(): boolean {
        if (!this.deviceTypeService.isSupportedBrowser()) {
            return false;
        }
        const unsupportedBrowsers = ['MS-Edge'];
        const browser = this.deviceTypeService.getBrowserName();
        return unsupportedBrowsers.findIndex(x => x.toUpperCase() === browser.toUpperCase()) < 0;
    }

    async connectToPexip(): Promise<void> {
        const logPayload = {
            conference: this.conferenceId,
            participant: this.participant.id
        };
        try {
            await this.setupPexipEventSubscriptionAndClient();

            this.eventHubSubscription$.add(
                this.eventService.onEventsHubReady().subscribe(async () => {
                    this.logger.info(`${this.loggerPrefix} EventHub ready`, {
                        conference: this.conferenceId,
                        participant: this.participant.id
                    });
                    await this.callAndUpdateShowVideo();
                })
            );
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} There was an error getting a jwtoken for heartbeat`, error, logPayload);
            this.errorService.handleApiError(error);
        }
    }

    async setupPexipEventSubscriptionAndClient() {
        this.logger.debug(`${this.loggerPrefix} Setting up pexip client and event subscriptions`);

        this.videoCallSubscription$.add(this.videoCallService.onCallSetup().subscribe(setup => this.handleCallSetup(setup)));
        this.videoCallSubscription$.add(
            this.videoCallService.onCallConnected().subscribe(callConnected => this.handleCallConnected(callConnected))
        );
        this.videoCallSubscription$.add(this.videoCallService.onError().subscribe(callError => this.handleCallError(callError)));
        this.videoCallSubscription$.add(
            this.videoCallService.onCallDisconnected().subscribe(disconnectedCall => this.handleCallDisconnect(disconnectedCall))
        );

        this.videoCallSubscription$.add(this.videoCallService.onCallTransferred().subscribe(() => this.handleCallTransfer()));

        this.videoCallSubscription$.add(
            this.videoCallService.onPresentation().subscribe(presentation => this.handlePresentationStatusChange(presentation))
        );

        this.videoCallSubscription$.add(
            this.videoCallService
                .onPresentationConnected()
                .subscribe(connectedPresentation => this.handlePresentationConnected(connectedPresentation))
        );

        this.videoCallSubscription$.add(
            this.videoCallService
                .onPresentationDisconnected()
                .subscribe(discconnectedPresentation => this.handlePresentationDisonnected(discconnectedPresentation))
        );

        await this.videoCallService.setupClient();
    }

    handlePresentationStatusChange(presentation: Presentation): void {
        if (presentation.presentationStarted) {
            this.videoCallService.retrievePresentation();
        } else {
            this.videoCallService.stopPresentation();
        }
    }

    handlePresentationDisonnected(discconnectedPresentation: DisconnectedPresentation): void {
        const logPayload = {
            conference: this.conferenceId,
            participant: this.participant.id,
            reason: discconnectedPresentation.reason
        };
        this.logger.warn(`${this.loggerPrefix} Presentation disconnected`, logPayload);
        this.presentationStream = null;
        this.videoCallService.stopPresentation();
    }
    handlePresentationConnected(connectedPresentation: ConnectedPresentation): void {
        const logPayload = {
            conference: this.conferenceId,
            participant: this.participant.id
        };
        this.logger.debug(`${this.loggerPrefix} Successfully connected to presentation`, logPayload);
        this.presentationStream = connectedPresentation.stream;
    }

    async call() {
        if (!this.eventService.eventHubIsConnected) {
            return;
        }

        const logPayload = {
            conference: this.conferenceId,
            participant: this.participant.id
        };
        this.logger.info(`${this.loggerPrefix} calling pexip`, logPayload);
        let pexipNode = this.hearing.getConference().pexip_node_uri;
        let conferenceAlias = this.hearing.getConference().participant_uri;
        let displayName = this.participant.tiled_display_name;
        if (this.needsInterpreterRoom()) {
            this.logger.debug(`${this.loggerPrefix} calling interpreter room`, logPayload);
            const interpreterRoom = await this.retrieveInterpreterRoom();
            this.linkedParticipantRoom = interpreterRoom;
            pexipNode = interpreterRoom.pexip_node;
            conferenceAlias = interpreterRoom.participant_join_uri;
            displayName = interpreterRoom.tile_display_name;
        }

        if (this.needsJudicialRoom()) {
            this.logger.debug(`${this.loggerPrefix} calling judicial room`, logPayload);
            const judicialRoom = await this.retrieveJudicialRoom();
            this.linkedParticipantRoom = judicialRoom;
            pexipNode = judicialRoom.pexip_node;
            conferenceAlias = judicialRoom.participant_join_uri;
            displayName = judicialRoom.tile_display_name;
        }

        this.logger.debug(`${this.loggerPrefix} Calling ${pexipNode} - ${conferenceAlias} as ${displayName}`, logPayload);
        this.videoCallService.makeCall(pexipNode, conferenceAlias, displayName, this.maxBandwidth);
    }

    needsInterpreterRoom(): boolean {
        if (!this.participant.linked_participants.length) {
            return false;
        }

        return this.participant.linked_participants.some(x => x.link_type === LinkType.Interpreter);
    }

    needsJudicialRoom(): boolean {
        return this.participant.role === Role.JudicialOfficeHolder;
    }

    retrieveInterpreterRoom(): Promise<SharedParticipantRoom> {
        const logPayload = {
            conference: this.conferenceId,
            participant: this.participant.id
        };

        if (this.isOrHasWitnessLink()) {
            this.logger.debug(`${this.loggerPrefix} getting witness interpreter room for participant`, logPayload);
            return this.videoCallService.retrieveWitnessInterpreterRoom(this.conference.id, this.participant.id);
        } else {
            this.logger.debug(`${this.loggerPrefix} getting standard interpreter room for participant`, logPayload);
            return this.videoCallService.retrieveInterpreterRoom(this.conference.id, this.participant.id);
        }
    }

    retrieveJudicialRoom(): Promise<SharedParticipantRoom> {
        const logPayload = {
            conference: this.conferenceId,
            participant: this.participant.id
        };

        this.logger.debug(`${this.loggerPrefix} getting judicial room for participant`, logPayload);
        return this.videoCallService.retrieveJudicialRoom(this.conference.id, this.participant.id);
    }

    isQuickLinkParticipant(): boolean {
        return (
            this.participant?.role.toUpperCase() === Role.QuickLinkObserver.toUpperCase() ||
            this.participant?.role.toUpperCase() === Role.QuickLinkParticipant.toUpperCase()
        );
    }

    isOrHasWitnessLink(): boolean {
        if (this.participant?.hearing_role.toUpperCase() === HearingRole.WITNESS.toUpperCase()) {
            return true;
        }
        if (!this.participant?.linked_participants.length) {
            return false;
        }
        const linkedParticipants = this.conference.participants.filter(p =>
            this.participant.linked_participants.map(lp => lp.linked_id).includes(p.id)
        );
        return linkedParticipants.some(lp => lp.hearing_role.toUpperCase() === HearingRole.WITNESS.toUpperCase());
    }

    disconnect() {
        if (this.connected) {
            this.videoCallService.disconnectFromCall();
        }
        this.stream = null;
        this.outgoingStream = null;
        this.connected = false;
        this.showVideo = false;
    }

    assignStream(videoElement, stream) {
        if (typeof MediaStream !== 'undefined' && stream instanceof MediaStream) {
            videoElement.srcObject = stream;
        } else {
            videoElement.src = stream;
        }
    }

    handleCallSetup(callSetup: CallSetup) {
        const logPayload = {
            conference: this.conferenceId,
            participant: this.participant.id
        };

        this.logger.debug(`${this.loggerPrefix} Conference has setup`, logPayload);
        this.videoCallService.connect('', null);
        this.outgoingStream = callSetup.stream;
    }

    async handleCallConnected(callConnected: ConnectedCall): Promise<void> {
        this.errorCount = 0;
        this.connected = true;
        this.logger.debug(`${this.loggerPrefix} Successfully connected to hearing`, { conference: this.conferenceId });
        this.stream = callConnected.stream;
        const incomingFeedElement = document.getElementById('incomingFeed') as any;
        if (this.stream) {
            this.updateShowVideo();
            if (incomingFeedElement) {
                this.assignStream(incomingFeedElement, callConnected.stream);
            }
        }
        if (this.hearingControls && !this.audioOnly && this.hearingControls.videoMuted) {
            await this.hearingControls.toggleVideoMute();
        }
    }

    handleCallError(error: CallError): void {
        this.errorCount++;
        this.connected = false;
        this.updateShowVideo();
        this.logger.error(`${this.loggerPrefix} Error from pexip. Reason : ${error.reason}`, new Error(error.reason), {
            pexipError: error,
            conference: this.conferenceId,
            participant: this.participant.id
        });
        this.errorService.handlePexipError(error, this.conferenceId);
    }

    handleCallDisconnect(reason: DisconnectedCall): void {
        this.connected = false;
        this.updateShowVideo();
        this.logger.warn(`${this.loggerPrefix} Disconnected from pexip. Reason : ${reason.reason}`);
        if (!this.hearing.isPastClosedTime()) {
            this.logger.warn(`${this.loggerPrefix} Attempting to reconnect to pexip in ${this.CALL_TIMEOUT}ms`);
            this.callbackTimeout = setTimeout(async () => {
                await this.callAndUpdateShowVideo();
            }, this.CALL_TIMEOUT);
        }
    }

    handleCallTransfer(): void {
        this.stream = null;
    }

    handleConferenceStatusChange(message: ConferenceStatusMessage) {
        this.logger.debug(
            `${this.loggerPrefix} Handling conference status message : ${this.conferenceId}, Case name : ${this.conference.case_name}, Conference status : ${message.status}`,
            message
        );
        if (!this.validateIsForConference(message.conferenceId)) {
            return;
        }
        this.hearing.getConference().status = message.status;
        this.conference.status = message.status;
        if (message.status === ConferenceStatus.InSession) {
            this.countdownComplete = false;
        }

        if (message.status === ConferenceStatus.Closed) {
            this.getConferenceClosedTime(this.hearing.id);
        }
        this.presentationStream = null;
        this.videoCallService.stopScreenShare();
    }

    shouldMuteHearing(): boolean {
        return !this.countdownComplete && this.hearing.isInSession();
    }

    updateVideoStreamMuteStatus() {
        if (this.shouldMuteHearing()) {
            this.toggleVideoStreamMute(true);
        } else {
            this.toggleVideoStreamMute(false);
        }
    }

    toggleVideoStreamMute(muted: boolean): void {
        if (this.videoStream) {
            this.logger.debug(`${this.loggerPrefix} Updating video stream mute status to ${muted}`, {
                conference: this.conferenceId,
                participant: this.participant.id
            });
            this.videoStream.nativeElement.muted = muted;
        }
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage): void {
        if (!this.validateIsForConference(message.conferenceId)) {
            return;
        }
        const participant = this.hearing.getConference().participants.find(p => p.id === message.participantId);
        const isMe = this.participant.id === participant.id;
        if (isMe) {
            this.participant.status = message.status;
            this.isTransferringIn = false;
        }
        participant.status = message.status;
        this.logger.info(`${this.conferenceId} ${this.loggerPrefix} Handling participant update status change`, {
            conference: this.conferenceId,
            participant: participant.id,
            status: participant.status
        });
        if (message.status !== ParticipantStatus.InConsultation && isMe) {
            this.isAdminConsultation = false;
        }
        if (message.status === ParticipantStatus.Disconnected && participant) {
            participant.current_room = null;
        }
    }

    handleEndpointStatusChange(message: EndpointStatusMessage) {
        if (!this.validateIsForConference(message.conferenceId)) {
            return;
        }

        const endpoint = this.hearing.getEndpoints().find(p => p.id === message.endpointId);
        if (!endpoint) {
            return;
        }

        endpoint.status = message.status;
        if (message.status === EndpointStatus.Disconnected) {
            endpoint.current_room = null;
        }
    }

    handleHearingTransferChange(message: HearingTransfer) {
        if (!this.validateIsForConference(message.conferenceId)) {
            return;
        }
        const participant = this.hearing.getConference().participants.find(p => p.id === message.participantId);
        const isMe = this.participant.id === participant.id;
        if (isMe) {
            this.isTransferringIn = false;
            this.isTransferringIn = message.transferDirection === TransferDirection.In;
            if (this.isTransferringIn) {
                this.notificationSoundsService.playHearingAlertSound();
            }
            this.logger.info(`${this.loggerPrefix} updating transfer status`, {
                conference: message.conferenceId,
                transferDirection: message.transferDirection,
                participant: message.participantId
            });
        }
    }

    handleCountdownCompleteMessage(conferenceId: string) {
        if (!this.validateIsForConference(conferenceId)) {
            return;
        }
        this.countdownComplete = true;
        this.toggleVideoStreamMute(false);
    }

    private handleParticipantsUpdatedMessage(participantsUpdatedMessage: ParticipantsUpdatedMessage) {
        this.logger.debug(`[WR] - Participants updated message recieved`, participantsUpdatedMessage.participants);

        if (!this.validateIsForConference(participantsUpdatedMessage.conferenceId)) {
            return;
        }

        const newParticipants = participantsUpdatedMessage.participants.filter(x => !this.conference.participants.find(y => y.id === x.id));

        newParticipants.forEach(participant => {
            this.logger.debug(`[WR] - Participant added, showing notification`, participant);
            this.notificationToastrService.showParticipantAdded(
                participant,
                this.participant.status === ParticipantStatus.InHearing || this.participant.status === ParticipantStatus.InConsultation
            );
        });

        this.conference.participants = [...participantsUpdatedMessage.participants].map(participant => {
            const currentParticipant = this.conference.participants.find(x => x.id === participant.id);
            participant.current_room = currentParticipant ? currentParticipant.current_room : null;
            participant.status = currentParticipant ? currentParticipant.status : ParticipantStatus.NotSignedIn;
            return participant;
        });
        this.participant = this.getLoggedParticipant();
    }

    private handleHearingLayoutUpdatedMessage(hearingLayoutMessage: HearingLayoutChanged) {
        this.logger.debug(`[WR] - Hearing layout changed message recieved`, hearingLayoutMessage);
        if (!this.validateIsForConference(hearingLayoutMessage.conferenceId)) {
            return;
        }

        if (!this.isHost()) {
            return;
        }
        const participant = this.findParticipant(hearingLayoutMessage.changedById);
        if (participant.id === this.getLoggedParticipant().id) {
            return;
        }

        this.logger.debug(`[WR] - Hearing Layout Changed showing notification`, participant);
        this.notificationToastrService.showHearingLayoutchanged(
            participant,
            this.participant.status === ParticipantStatus.InHearing || this.participant.status === ParticipantStatus.InConsultation
        );
    }

    protected validateIsForConference(conferenceId: string): boolean {
        if (conferenceId !== this.hearing.id) {
            this.logger.info(`${this.loggerPrefix} message not for current conference`);
            return false;
        }
        return true;
    }

    async onConsultationCancelled() {
        const logPayload = {
            conference: this.conferenceId,
            caseName: this.conference.case_name,
            participant: this.participant.id
        };
        this.logger.info(`${this.loggerPrefix} Participant is attempting to leave the private consultation`, logPayload);
        try {
            await this.consultationService.leaveConsultation(this.conference, this.participant);
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Failed to leave private consultation`, error, logPayload);
        }
    }

    async joinJudicialConsultation() {
        this.logger.info(`${this.loggerPrefix} attempting to join a private judicial consultation`, {
            conference: this.conference?.id,
            participant: this.participant.id
        });
        await this.consultationService.joinJudicialConsultationRoom(this.conference, this.participant);
    }

    async leaveJudicialConsultation() {
        this.logger.info(`${this.loggerPrefix} attempting to leave a private judicial consultation`, {
            conference: this.conference?.id,
            participant: this.participant.id
        });
        await this.consultationService.leaveConsultation(this.conference, this.participant);
    }

    updateShowVideo(): void {
        const logPaylod = {
            conference: this.conferenceId,
            caseName: this.conference.case_name,
            participant: this.participant.id,
            showingVideo: false,
            reason: ''
        };
        if (this.dualHostHasSignalledToJoinHearing && !this.isHost()) {
            this.dualHostHasSignalledToJoinHearing = false;
        }
        if (!this.connected) {
            logPaylod.showingVideo = false;
            logPaylod.reason = 'Not showing video because not connecting to pexip node';
            this.logger.debug(`${this.loggerPrefix} ${logPaylod.reason}`, logPaylod);
            this.showVideo = false;
            this.showConsultationControls = false;
            this.isPrivateConsultation = false;
            return;
        }

        if (this.participant.status === ParticipantStatus.InConsultation) {
            logPaylod.showingVideo = true;
            logPaylod.reason = 'Showing video because participant is in a consultation';
            this.logger.debug(`${this.loggerPrefix} ${logPaylod.reason}`, logPaylod);
            this.displayDeviceChangeModal = false;
            this.showVideo = true;
            this.isPrivateConsultation = true;
            this.showConsultationControls = !this.isAdminConsultation;
            return;
        }

        if (
            this.hearing.isInSession() &&
            !this.isOrHasWitnessLink() &&
            !this.isQuickLinkParticipant() &&
            this.shouldCurrentUserJoinHearing()
        ) {
            logPaylod.showingVideo = true;
            logPaylod.reason = 'Showing video because hearing is in session';
            this.logger.debug(`${this.loggerPrefix} ${logPaylod.reason}`, logPaylod);
            this.displayDeviceChangeModal = false;
            this.showVideo = true;
            this.showConsultationControls = false;
            this.isPrivateConsultation = false;
            return;
        }

        if ((this.isOrHasWitnessLink() || this.isQuickLinkParticipant()) && this.participant.status === ParticipantStatus.InHearing) {
            logPaylod.showingVideo = true;
            logPaylod.reason = 'Showing video because witness is in hearing';
            this.logger.debug(`${this.loggerPrefix} ${logPaylod.reason}`, logPaylod);
            this.displayDeviceChangeModal = false;
            this.showVideo = true;
            this.showConsultationControls = false;
            this.isPrivateConsultation = false;
            return;
        }

        logPaylod.showingVideo = false;
        logPaylod.reason = 'Not showing video because hearing is not in session and user is not in consultation';
        this.logger.debug(`${this.loggerPrefix} ${logPaylod.reason}`, logPaylod);
        this.showVideo = false;
        this.conferenceStartedBy = null;
        this.showConsultationControls = false;
        this.isPrivateConsultation = false;
        this.dualHostHasSignalledToJoinHearing = false;
    }

    shouldCurrentUserJoinHearing(): boolean {
        return (
            !this.isHost() ||
            this.dualHostHasSignalledToJoinHearing ||
            (this.isHost() && this.participant.status === ParticipantStatus.InHearing)
        );
    }

    isHost(): boolean {
        return this.participant.role === Role.Judge || this.participant.role === Role.StaffMember;
    }

    showChooseCameraDialog() {
        this.displayDeviceChangeModal = true;
    }

    onSelectMediaDeviceShouldClose() {
        this.displayDeviceChangeModal = false;
    }

    async publishMediaDeviceStatus() {
        this.hearingControls.audioOnly = this.audioOnly;
        await this.hearingControls.publishMediaDeviceStatus();
    }

    get showExtraContent(): boolean {
        return !this.showVideo && !this.isTransferringIn;
    }

    get hasCaseNameOverflowed(): boolean {
        if (!this.roomTitleLabel) {
            return false;
        }
        return this.roomTitleLabel.nativeElement.scrollWidth > this.roomTitleLabel.nativeElement.clientWidth;
    }

    executeWaitingRoomCleanup() {
        this.logger.debug(`${this.loggerPrefix} - Clearing intervals and subscriptions for waiting room`, {
            conference: this.conference?.id
        });
        clearTimeout(this.callbackTimeout);
        this.disconnect();
        this.eventHubSubscription$.unsubscribe();
        this.videoCallSubscription$.unsubscribe();
        this.clockSubscription$.unsubscribe();

        this.roomClosingToastrService.clearToasts();
    }

    subscribeToClock(): void {
        this.clockSubscription$.add(
            this.clockService.getClock().subscribe(time => {
                this.currentTime = time;
                this.checkIfHearingIsClosed();
                this.checkIfHearingIsStarting();
                this.showRoomClosingToast(time);
            })
        );
    }

    showRoomClosingToast(dateNow: Date) {
        if (this.isPrivateConsultation) {
            this.roomClosingToastrService.showRoomClosingAlert(this.hearing, dateNow);
        } else {
            this.roomClosingToastrService.clearToasts();
        }
    }

    checkIfHearingIsClosed(): void {
        if (this.hearing.isPastClosedTime()) {
            this.clockSubscription$.unsubscribe();
            this.router.navigate([pageUrls.Home]);
        }
    }

    checkIfHearingIsStarting(): void {
        if (this.hearing.isStarting() && !this.hearingStartingAnnounced) {
            this.announceHearingIsAboutToStart();
        }
    }

    async announceHearingIsAboutToStart(): Promise<void> {
        this.hearingStartingAnnounced = true;
        await this.notificationSoundsService.playHearingAlertSound();
    }

    closeAllPCModals(): void {
        this.consultationService.clearModals();
    }

    showLeaveConsultationModal(): void {
        this.consultationService.displayConsultationLeaveModal();
    }

    switchStreamWindows(): void {
        this.streamInMain = !this.streamInMain;
    }

    async callAndUpdateShowVideo(): Promise<void> {
        await this.call();
        this.getConference().then(() => this.updateShowVideo());
    }
}
