import { Directive, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
    ParticipantStatus,
    Role,
    RoomSummaryResponse,
    SharedParticipantRoom,
    TokenResponse,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { EndpointStatusMessage } from 'src/app/services/models/EndpointStatusMessage';
import { HearingTransfer, TransferDirection } from 'src/app/services/models/hearing-transfer';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { HeartbeatModelMapper } from 'src/app/shared/mappers/heartbeat-model-mapper';
import { Hearing } from 'src/app/shared/models/hearing';
import { Participant } from 'src/app/shared/models/participant';
import { Room } from 'src/app/shared/models/room';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';
import { SelectedUserMediaDevice } from '../../shared/models/selected-user-media-device';
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
import { NotificationSoundsService } from '../services/notification-sounds.service';
import { NotificationToastrService } from '../services/notification-toastr.service';
import { RoomClosingToastrService } from '../services/room-closing-toast.service';
import { VideoCallService } from '../services/video-call.service';

declare var HeartbeatFactory: any;

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
    token: TokenResponse;

    eventHubSubscription$ = new Subscription();
    videoCallSubscription$ = new Subscription();
    clockSubscription$: Subscription = new Subscription();
    currentTime: Date;
    heartbeat: any;

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

    CALL_TIMEOUT = 31000; // 31 seconds
    callbackTimeout: NodeJS.Timer;
    private readonly loggerPrefix = '[WR] -';
    loggedInUser: LoggedParticipantResponse;
    linkedParticipantRoom: SharedParticipantRoom;

    @ViewChild('incomingFeed', { static: false }) videoStream: ElementRef<HTMLVideoElement>;
    @ViewChild('roomTitleLabel', { static: false }) roomTitleLabel: ElementRef<HTMLDivElement>;
    @ViewChild('hearingControls', { static: false }) hearingControls: PrivateConsultationRoomControlsComponent;
    countdownComplete: boolean;
    consultationInviteToasts: { [roomLabel: string]: VhToastComponent } = {};

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
        protected userMediaService: UserMediaService,
        protected userMediaStreamService: UserMediaStreamService,
        protected notificationSoundsService: NotificationSoundsService,
        protected notificationToastrService: NotificationToastrService,
        protected roomClosingToastrService: RoomClosingToastrService,
        protected clockService: ClockService
    ) {
        this.isAdminConsultation = false;
        this.loadingData = true;
        this.showVideo = false;
        this.showConsultationControls = false;
        this.isPrivateConsultation = false;
        this.errorCount = 0;
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

    setLoggedParticipant(): ParticipantResponse {
        return this.conference.participants.find(x => x.id === this.loggedInUser.participant_id);
    }

    stringToTranslateId(str: string) {
        return str.replace(/\s/g, '-').toLowerCase();
    }

    getConference() {
        return this.videoWebService
            .getConferenceById(this.conferenceId)
            .then((data: ConferenceResponse) => {
                this.errorCount = 0;
                this.loadingData = false;
                this.countdownComplete = data.status === ConferenceStatus.InSession;
                this.hearing = new Hearing(data);
                this.conference = this.hearing.getConference();
                this.videoWebService.getAllowedEndpointsForConference(this.conferenceId).then((endpoints: AllowedEndpointResponse[]) => {
                    this.participantEndpoints = endpoints;
                });

                this.participant = this.setLoggedParticipant();
                this.logger.debug(`${this.loggerPrefix} Getting conference details`, {
                    conference: this.conferenceId,
                    participant: this.participant.id
                });
            })
            .catch(error => {
                this.logger.error(`${this.loggerPrefix} There was an error getting a conference ${this.conferenceId}`, error, {
                    conference: this.conferenceId
                });
                this.loadingData = false;
                this.errorService.handleApiError(error);
            });
    }

    async getConferenceClosedTime(conferenceId: string): Promise<void> {
        try {
            this.conference = await this.videoWebService.getConferenceById(conferenceId);
            this.hearing = new Hearing(this.conference);

            if (!this.participant) {
                this.participant = this.setLoggedParticipant();
            }

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
                if (message.answer && message.answer === ConsultationAnswer.Accepted && message.requestedFor === this.participant.id) {
                    await this.onConsultationAccepted();
                }
                if (message.answer && message.answer === ConsultationAnswer.Rejected && message.requestedFor === this.participant.id) {
                    this.onConsultationRejected(message.roomLabel);
                }
            })
        );

        this.logger.debug(`${this.loggerPrefix} Subscribing to RequestedConsultationMessage`);
        this.eventHubSubscription$.add(
            this.eventService.getRequestedConsultationMessage().subscribe(message => {
                const requestedFor = new Participant(this.findParticipant(message.requestedFor));
                if (requestedFor.id === this.participant.id && this.participant.status !== ParticipantStatus.InHearing) {
                    // A request for you to join a consultation room
                    this.logger.debug(`${this.loggerPrefix} Recieved RequestedConsultationMessage`);
                    const requestedParticipant = this.findParticipant(message.requestedBy);
                    const requestedBy =
                        requestedParticipant === undefined || requestedParticipant === null
                            ? null
                            : new Participant(this.findParticipant(message.requestedBy));
                    const roomParticipants = this.findParticipantsInRoom(message.roomLabel).map(x => new Participant(x));
                    const roomEndpoints = this.findEndpointsInRoom(message.roomLabel);
                    console.log("[ROB]", "room label", message);
                    const consultationInviteToast = this.notificationToastrService.showConsultationInvite(
                        message.roomLabel,
                        message.conferenceId,
                        requestedBy,
                        requestedFor,
                        roomParticipants,
                        roomEndpoints,
                        this.participant.status !== ParticipantStatus.Available
                    );
                    this.consultationInviteToasts[message.roomLabel] = consultationInviteToast;
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
                console.log("[ROB] - Room Update", room);
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
                console.log("[ROB] - Room Transfer", roomTransfer);
                if (participant) {
                    console.log("[ROB] - Room Transfer - Participant", participant.current_room, participant);
                    participant.current_room = null;
                    console.log("[ROB] - Room Transfer - Participant SET TO NULL", participant.current_room, participant);
                    if (roomTransfer.to_room.toLowerCase().indexOf('consultation') >= 0) {
                        const room = this.conferenceRooms.find(r => r.label === roomTransfer.to_room);
                        participant.current_room = room
                            ? new RoomSummaryResponse(room)
                            : new RoomSummaryResponse({ label: roomTransfer.to_room });
                        console.log("[ROB] - Room Transfer - Participant SET TO ROOM", participant.current_room, participant);
                                                }
                } else if (endpoint) {
                    endpoint.current_room = null;
                    if (roomTransfer.to_room.toLowerCase().indexOf('consultation') >= 0) {
                        const room = this.conferenceRooms.find(r => r.label === roomTransfer.to_room);
                        endpoint.current_room = room
                            ? new RoomSummaryResponse(room)
                            : new RoomSummaryResponse({ label: roomTransfer.to_room });
                    }
                }
            })
        );

        this.logger.debug(`${this.loggerPrefix} Subscribing to EventHub reconnects`);
        this.eventHubSubscription$.add(
            this.eventService.getServiceReconnected().subscribe(() => {
                this.logger.info(`${this.loggerPrefix} EventHub re-connected`, {
                    conference: this.conferenceId,
                    participant: this.participant.id
                });
                this.getConference().then(() => this.updateShowVideo());
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

    async onConsultationAccepted() {
        this.displayStartPrivateConsultationModal = false;
        this.displayJoinPrivateConsultationModal = false;
        this.privateConsultationAccordianExpanded = false;

        if (this.displayDeviceChangeModal) {
            this.logger.debug(`${this.loggerPrefix} Participant accepted a consultation. Closing change device modal.`);
            const preferredCamera = await this.userMediaService.getPreferredCamera();
            const preferredMicrophone = await this.userMediaService.getPreferredMicrophone();
            const preferredCameraStream = await this.userMediaStreamService.getStreamForCam(preferredCamera);
            const preferredMicrophoneStream = await this.userMediaStreamService.getStreamForMic(preferredMicrophone);

            this.userMediaStreamService.stopStream(preferredCameraStream);
            this.userMediaStreamService.stopStream(preferredMicrophoneStream);
            this.displayDeviceChangeModal = false;
        }
    }

    onConsultationRejected(roomLabel: string) {
        if (this.consultationInviteToasts[roomLabel]) {
            this.consultationInviteToasts[roomLabel].declinedByThirdParty = true;
        }
        this.notificationToastrService.clearAllToastNotifications();
    }

    async handleEventHubDisconnection(reconnectionAttempt: number) {
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

    setupParticipantHeartbeat() {
        const baseUrl = this.conference.pexip_node_uri.replace('sip.', '');
        const url = `https://${baseUrl}/virtual-court/api/v1/hearing/${this.conferenceId}`;
        const bearerToken = `Bearer ${this.token.token}`;
        this.heartbeat = new HeartbeatFactory(
            this.videoCallService.pexipAPI,
            url,
            this.conferenceId,
            this.participant.id,
            bearerToken,
            this.handleHeartbeat(this)
        );
    }

    get isSupportedBrowserForNetworkHealth(): boolean {
        if (!this.deviceTypeService.isSupportedBrowser()) {
            return false;
        }
        const unsupportedBrowsers = ['MS-Edge'];
        const browser = this.deviceTypeService.getBrowserName();
        return unsupportedBrowsers.findIndex(x => x.toUpperCase() === browser.toUpperCase()) < 0;
    }

    handleHeartbeat(self: this) {
        return async function (heartbeat) {
            const heartbeatModel = self.heartbeatMapper.map(
                JSON.parse(heartbeat),
                self.deviceTypeService.getBrowserName(),
                self.deviceTypeService.getBrowserVersion(),
                self.deviceTypeService.getOSName(),
                self.deviceTypeService.getOSVersion()
            );

            await self.eventService.sendHeartbeat(self.hearing.id, self.participant.id, heartbeatModel);
        };
    }

    async getJwtokenAndConnectToPexip(): Promise<void> {
        const logPayload = {
            conference: this.conferenceId,
            participant: this.participant.id
        };
        try {
            this.logger.debug(`${this.loggerPrefix} Retrieving jwtoken for heartbeat`, logPayload);
            this.token = await this.videoWebService.getJwToken(this.participant.id);
            this.logger.debug(`${this.loggerPrefix} Retrieved jwtoken for heartbeat`, logPayload);
            await this.setupPexipEventSubscriptionAndClient();
            await this.call();
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
        this.setupParticipantHeartbeat();
        if (this.hearingControls && !this.audioOnly && this.hearingControls.videoMuted) {
            await this.hearingControls.toggleVideoMute();
        }
    }

    handleCallError(error: CallError): void {
        this.stopHeartbeat();
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
        this.stopHeartbeat();
        this.updateShowVideo();
        this.logger.warn(`${this.loggerPrefix} Disconnected from pexip. Reason : ${reason.reason}`);
        if (!this.hearing.isPastClosedTime()) {
            this.logger.warn(`${this.loggerPrefix} Attempting to reconnect to pexip in ${this.CALL_TIMEOUT}ms`);
            this.callbackTimeout = setTimeout(async () => {
                await this.call();
            }, this.CALL_TIMEOUT);
        }
    }

    handleCallTransfer(): void {
        this.stream = null;
    }

    stopHeartbeat() {
        if (this.heartbeat) {
            this.heartbeat.kill();
        }
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
        this.logger.info(`${this.loggerPrefix} Handling participant update status change`, {
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
        if (!this.connected) {
            logPaylod.showingVideo = false;
            logPaylod.reason = 'Not showing video because not connecting to pexip node';
            this.logger.debug(`${this.loggerPrefix} ${logPaylod.reason}`, logPaylod);
            this.showVideo = false;
            this.showConsultationControls = false;
            this.isPrivateConsultation = false;
            return;
        }

        if (this.hearing.isInSession() && !this.isOrHasWitnessLink()) {
            logPaylod.showingVideo = true;
            logPaylod.reason = 'Showing video because hearing is in session';
            this.logger.debug(`${this.loggerPrefix} ${logPaylod.reason}`, logPaylod);
            this.displayDeviceChangeModal = false;
            this.showVideo = true;
            this.showConsultationControls = false;
            this.isPrivateConsultation = false;
            return;
        }

        if (this.isOrHasWitnessLink() && this.participant.status === ParticipantStatus.InHearing) {
            logPaylod.showingVideo = true;
            logPaylod.reason = 'Showing video because witness is in hearing';
            this.logger.debug(`${this.loggerPrefix} ${logPaylod.reason}`, logPaylod);
            this.displayDeviceChangeModal = false;
            this.showVideo = true;
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

        logPaylod.showingVideo = false;
        logPaylod.reason = 'Not showing video because hearing is not in session and user is not in consultation';
        this.logger.debug(`${this.loggerPrefix} ${logPaylod.reason}`, logPaylod);
        this.showVideo = false;
        this.showConsultationControls = false;
        this.isPrivateConsultation = false;
    }

    showChooseCameraDialog() {
        this.displayDeviceChangeModal = true;
    }

    onMediaDeviceChangeCancelled() {
        this.displayDeviceChangeModal = false;
    }

    async onMediaDeviceChangeAccepted(selectedMediaDevice: SelectedUserMediaDevice) {
        this.logger.debug(`${this.loggerPrefix} Updated device settings`, { selectedMediaDevice });
        this.userMediaService.updatePreferredCamera(selectedMediaDevice.selectedCamera);
        this.userMediaService.updatePreferredMicrophone(selectedMediaDevice.selectedMicrophone);
        this.audioOnly = selectedMediaDevice.audioOnly;
        this.updateAudioOnlyPreference(this.audioOnly);
        await this.updatePexipAudioVideoSource();
        this.videoCallService.reconnectToCallWithNewDevices();
        if (this.audioOnly) {
            this.videoCallService.switchToAudioOnlyCall();
        }
        if (this.hearingControls) {
            await this.publishMediaDeviceStatus();
        }
    }

    async publishMediaDeviceStatus() {
        this.hearingControls.audioOnly = this.audioOnly;
        await this.hearingControls.publishMediaDeviceStatus();
    }

    protected updateAudioOnlyPreference(audioOnly: boolean) {
        const videoCallPrefs = this.videoCallService.retrieveVideoCallPreferences();
        videoCallPrefs.audioOnly = audioOnly;
        this.videoCallService.updateVideoCallPreferences(videoCallPrefs);
    }

    private async updatePexipAudioVideoSource() {
        const cam = await this.userMediaService.getPreferredCamera();
        if (cam) {
            this.videoCallService.updateCameraForCall(cam);
        }

        const mic = await this.userMediaService.getPreferredMicrophone();
        if (mic) {
            this.videoCallService.updateMicrophoneForCall(mic);
        }
        this.logger.info(`${this.loggerPrefix} Update camera and microphone selection`, {
            cameraId: cam.deviceId,
            microphoneId: mic.deviceId
        });
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
        this.stopHeartbeat();
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
}
