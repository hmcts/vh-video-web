import { AfterContentChecked, Directive, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, Subscription, combineLatest, of } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    ConferenceStatus,
    ConsultationAnswer,
    EndpointStatus,
    LoggedParticipantResponse,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { PexipDisplayNameModel } from 'src/app/services/conference/models/pexip-display-name.model';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { EndpointStatusMessage } from 'src/app/services/models/EndpointStatusMessage';
import { HearingTransfer, TransferDirection } from 'src/app/services/models/hearing-transfer';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { vhContactDetails } from 'src/app/shared/contact-information';
import { Hearing } from 'src/app/shared/models/hearing';
import { ParticipantMediaStatusMessage } from 'src/app/shared/models/participant-media-status-message';
import { ParticipantsUpdatedMessage } from 'src/app/shared/models/participants-updated-message';
import { EndpointsUpdatedMessage } from 'src/app/shared/models/endpoints-updated-message';
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
import { ParticipantRemoteMuteStoreService } from '../services/participant-remote-mute-store.service';
import { RoomClosingToastrService } from '../services/room-closing-toast.service';
import { VideoCallService } from '../services/video-call.service';
import { Title } from '@angular/platform-browser';
import { HideComponentsService } from '../services/hide-components.service';
import { FocusService } from 'src/app/services/focus.service';
import { convertStringToTranslationId } from 'src/app/shared/translation-id-converter';
import { ConferenceState } from '../store/reducers/conference.reducer';
import { Store } from '@ngrx/store';
import { VHConference, VHEndpoint, VHParticipant, VHRoom } from '../store/models/vh-conference';
import * as ConferenceSelectors from '../store/selectors/conference.selectors';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { HearingDetailsUpdatedMessage } from 'src/app/services/models/hearing-details-updated-message';
import { ConferenceActions } from '../store/actions/conference.actions';

@Directive()
export abstract class WaitingRoomBaseDirective implements AfterContentChecked {
    @ViewChild('roomTitleLabel', { static: false }) roomTitleLabel: ElementRef<HTMLDivElement>;
    @ViewChild('hearingControls', { static: false }) hearingControls: PrivateConsultationRoomControlsComponent;

    instantMessagingEnabled = false;

    maxBandwidth = null;
    audioOnly: boolean;
    hearingStartingAnnounced: boolean;
    privateConsultationAccordianExpanded = false;
    loadingData: boolean;
    errorCount: number;
    hearing: Hearing;
    participant: ParticipantResponse;
    conference: ConferenceResponse; // Will be removed when migrationg to ngrx store is complete
    vhConference: VHConference;
    vhParticipant: VHParticipant;
    participantEndpoints: VHEndpoint[] = [];
    conferenceRooms: VHRoom[] = [];

    eventHubSubscription$ = new Subscription();
    videoCallSubscription$ = new Subscription();
    currentTime: Date;

    callStream: MediaStream | URL;
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
    phoneNumber$: Observable<string>;
    hasCaseNameOverflowed = false;

    divTrapId: string;

    panelTypes = ['Participants', 'Chat'];
    panelStates = {
        Participants: true,
        Chat: false
    };

    CALL_TIMEOUT = 31000; // 31 seconds
    callbackTimeout: ReturnType<typeof setTimeout> | number;

    loggedInUser: LoggedParticipantResponse;
    contactDetails = vhContactDetails;

    countdownComplete: boolean;
    hasTriedToLeaveConsultation: boolean;
    connectionFailedCount: number;
    CONNECTION_FAILED_LIMIT = 3;

    protected onDestroy$ = new Subject<void>();

    private readonly loggerPrefix = '[WR] -';
    private readonly CONSULATION_LEAVE_MODAL_DEFAULT_ELEMENT = 'consultation-leave-button';
    private readonly SELECT_MEDIA_DEVICES_MODAL_DEFAULT_ELEMENT = 'toggle-media-device-img-desktop';

    protected constructor(
        protected route: ActivatedRoute,
        protected videoWebService: VideoWebService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected errorService: ErrorService,
        protected videoCallService: VideoCallService,
        protected deviceTypeService: DeviceTypeService,
        protected router: Router,
        protected consultationService: ConsultationService,
        protected notificationSoundsService: NotificationSoundsService,
        protected notificationToastrService: NotificationToastrService,
        protected roomClosingToastrService: RoomClosingToastrService,
        protected clockService: ClockService,
        protected consultationInvitiationService: ConsultationInvitationService,
        protected participantRemoteMuteStoreService: ParticipantRemoteMuteStoreService,
        protected titleService: Title,
        protected hideComponentsService: HideComponentsService,
        protected focusService: FocusService,
        protected launchDarklyService: LaunchDarklyService,
        protected store: Store<ConferenceState>
    ) {
        this.launchDarklyService
            .getFlag<boolean>(FEATURE_FLAGS.instantMessaging, false)
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(flag => {
                this.instantMessagingEnabled = flag;
            });
        this.store
            .select(ConferenceSelectors.getActiveConference)
            .pipe(
                takeUntil(this.onDestroy$),
                filter(conf => !!conf)
            )
            .subscribe(conf => {
                this.countdownComplete = conf.countdownComplete;
                this.vhConference = conf;
                // this does not need to be an observable and we can move away from the flag service
                this.phoneNumber$ = this.vhConference.isVenueScottish
                    ? of(this.contactDetails.scotland.phoneNumber)
                    : of(this.contactDetails.englandAndWales.phoneNumber);
            });

        this.store
            .select(ConferenceSelectors.getAvailableRooms)
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(rooms => (this.conferenceRooms = rooms));
        this.isAdminConsultation = false;
        this.loadingData = true;
        this.setShowVideo(false);
        this.showConsultationControls = false;
        this.isPrivateConsultation = false;
        this.errorCount = 0;
        this.connectionFailedCount = 0;

        const loggedInParticipant$ = this.store.select(ConferenceSelectors.getLoggedInParticipant);
        const endpoints$ = this.store.select(ConferenceSelectors.getEndpoints);

        combineLatest([loggedInParticipant$, endpoints$])
            .pipe(
                takeUntil(this.onDestroy$),
                filter(([participant, endpoints]) => !!participant && !!endpoints)
            )
            .subscribe(([participant, endpoints]) => {
                this.vhParticipant = participant;
                this.participantEndpoints = this.filterEndpoints(endpoints, participant);
            });
    }

    get showExtraContent(): boolean {
        return !this.showVideo && !this.isTransferringIn;
    }

    get conferenceId(): string {
        if (this.conference) {
            return this.conference.id;
        }
        return this.route.snapshot.paramMap.get('conferenceId');
    }

    get numberOfJudgeOrJOHsInConsultation(): number {
        return this.vhConference.participants.filter(
            x =>
                (x.role === Role.Judge || x.role === Role.JudicialOfficeHolder) &&
                x.status === ParticipantStatus.InConsultation &&
                x.room?.label.toLowerCase().startsWith('judgejohconsultationroom')
        ).length;
    }

    get areParticipantsVisible() {
        return this.panelStates['Participants'];
    }

    get isSupportedBrowserForNetworkHealth(): boolean {
        if (!this.deviceTypeService.isSupportedBrowser()) {
            return false;
        }
        const unsupportedBrowsers = ['MS-Edge'];
        const browser = this.deviceTypeService.getBrowserName();
        return unsupportedBrowsers.findIndex(x => x.toUpperCase() === browser.toUpperCase()) < 0;
    }

    get isParticipantInConference(): boolean {
        return this.participant?.status === ParticipantStatus.InHearing || this.participant?.status === ParticipantStatus.InConsultation;
    }

    ngAfterContentChecked(): void {
        this.checkCaseNameOverflow();
    }

    filterEndpoints(endpoints: VHEndpoint[], participant: VHParticipant): VHEndpoint[] {
        const hostRoles = [Role.Judge, Role.StaffMember];
        let filtered: VHEndpoint[] = [];
        if (hostRoles.includes(participant.role)) {
            filtered = endpoints;
        } else {
            filtered = endpoints.filter(endpoint => endpoint.defenceAdvocate?.toLowerCase() === participant.username?.toLowerCase());
        }
        return filtered;
    }

    checkCaseNameOverflow() {
        if (this.roomTitleLabel) {
            this.hasCaseNameOverflowed = this.roomTitleLabel.nativeElement.scrollWidth > this.roomTitleLabel.nativeElement.clientWidth;
        } else {
            this.hasCaseNameOverflowed = false;
        }
    }

    isParticipantInCorrectWaitingRoomState(): boolean {
        return (
            this.connected &&
            this.participant.status === ParticipantStatus.Available &&
            (!this.participant.current_room || this.participant.current_room.label === 'WaitingRoom')
        );
    }

    getLoggedParticipant(): ParticipantResponse {
        return this.conference.participants.find(x => x.id === this.loggedInUser.participant_id);
    }

    stringToTranslateId(str: string) {
        return convertStringToTranslationId(str);
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
            this.setConference(data);

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
        this.eventHubSubscription$.add(
            this.eventService.getHearingStatusMessage().subscribe(message => {
                this.handleConferenceStatusChange(message);
                this.updateShowVideo();
            })
        );

        this.eventHubSubscription$.add(
            this.eventService.getParticipantStatusMessage().subscribe(message => {
                this.handleParticipantStatusChange(message);
                this.updateShowVideo();
            })
        );

        this.eventHubSubscription$.add(
            this.eventService.getEndpointStatusMessage().subscribe(message => {
                this.handleEndpointStatusChange(message);
                this.updateShowVideo();
            })
        );

        this.eventHubSubscription$.add(
            this.eventService.getParticipantMediaStatusMessage().subscribe(message => {
                this.handleLocalAudioVideoMuteStatus(message);
            })
        );

        this.eventHubSubscription$.add(
            this.eventService.getConsultationRequestResponseMessage().subscribe(message => {
                if (!message.answer) {
                    return;
                }
                if (message.requestedFor === this.participant.id) {
                    this.handleMyConsultationResponse(message.answer, message.requestedFor, message.responseInitiatorId, message.roomLabel);
                } else {
                    this.handleLinkedParticipantConsultationResponse(
                        message.answer,
                        message.requestedFor,
                        message.responseInitiatorId,
                        message.roomLabel
                    );
                }
            })
        );

        this.eventHubSubscription$.add(
            this.eventService.getServiceDisconnected().subscribe(async attemptNumber => {
                await this.handleEventHubDisconnection(attemptNumber);
            })
        );

        this.eventHubSubscription$.add(
            this.eventService.getServiceConnected().subscribe(async () => {
                this.logger.debug(`${this.loggerPrefix} EventHub re-connected`, {
                    conference: this.conferenceId,
                    participant: this.participant.id
                });
                await this.loadConferenceAndUpdateVideo();
            })
        );

        this.eventHubSubscription$.add(
            this.eventService.getHearingTransfer().subscribe(async message => {
                this.handleHearingTransferChange(message);
                this.updateShowVideo();
            })
        );

        this.eventHubSubscription$.add(
            this.eventService.getHearingCountdownCompleteMessage().subscribe(conferenceId => {
                this.handleCountdownCompleteMessage(conferenceId);
                this.updateShowVideo();
            })
        );

        this.eventHubSubscription$.add(
            this.eventService.getParticipantsUpdated().subscribe(async participantsUpdatedMessage => {
                this.handleParticipantsUpdatedMessage(participantsUpdatedMessage);
            })
        );

        this.eventHubSubscription$.add(
            this.eventService.getEndpointsUpdated().subscribe(async endpointsUpdatedMessage => {
                await this.getConference.bind(this);
                this.handleEndpointsUpdatedMessage(endpointsUpdatedMessage);
            })
        );

        this.eventHubSubscription$.add(
            this.eventService.getHearingDetailsUpdated().subscribe(hearingDetailsUpdatedMessage => {
                this.handleHearingDetailsUpdated(hearingDetailsUpdatedMessage);
            })
        );
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

    async connectToPexip(): Promise<void> {
        const logPayload = {
            conference: this.conferenceId,
            participant: this.participant.id
        };
        try {
            await this.setupPexipEventSubscriptionAndClient();
            this.call();
            this.eventHubSubscription$.add(
                this.eventService.onEventsHubReady().subscribe(async () => {
                    this.logger.debug(`${this.loggerPrefix} EventHub ready`, {
                        conference: this.conferenceId,
                        participant: this.participant.id
                    });
                    await this.loadConferenceAndUpdateVideo();
                })
            );
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} There was an error getting a jwtoken for heartbeat`, error, logPayload);
            this.errorService.handleApiError(error);
        }
    }

    async setupPexipEventSubscriptionAndClient() {
        this.logger.debug(`${this.loggerPrefix} Setting up pexip client and event subscriptions`);
        this.videoCallSubscription$.add(
            this.videoCallService.onParticipantUpdated().subscribe(participantUpdate => {
                const pexipDisplayNameModel = PexipDisplayNameModel.fromString(participantUpdate.pexipDisplayName);

                if (pexipDisplayNameModel === null) {
                    return;
                }

                this.logger.debug(
                    `${this.loggerPrefix} Setting up participant remote mute status for ${pexipDisplayNameModel.participantOrVmrId} is '${participantUpdate.isRemoteMuted}''`
                );

                this.participantRemoteMuteStoreService.updateRemoteMuteStatus(
                    pexipDisplayNameModel.participantOrVmrId,
                    participantUpdate.isRemoteMuted
                );
            })
        );

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

        await this.videoCallService.setupClient(this.conference.supplier);
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
        this.logger.debug(`${this.loggerPrefix} calling pexip`, logPayload);
        const pexipNode = this.hearing.getConference().pexip_node_uri;
        const conferenceAlias = this.hearing.getConference().participant_uri;
        const displayName = this.participant.tiled_display_name;

        this.logger.debug(`${this.loggerPrefix} Calling ${pexipNode} - ${conferenceAlias} as ${displayName}`, logPayload);

        await this.videoCallService.makeCall(pexipNode, conferenceAlias, displayName, this.maxBandwidth, this.conferenceId);
    }

    isQuickLinkParticipant(): boolean {
        return (
            this.vhParticipant?.role.toUpperCase() === Role.QuickLinkObserver.toUpperCase() ||
            this.vhParticipant?.role.toUpperCase() === Role.QuickLinkParticipant.toUpperCase()
        );
    }

    isOrHasWitnessLink(): boolean {
        if (this.vhParticipant?.hearingRole.toUpperCase() === HearingRole.WITNESS.toUpperCase()) {
            return true;
        }
        if (!this.vhParticipant?.linkedParticipants.length) {
            return false;
        }
        const linkedParticipants = this.conference.participants.filter(p =>
            this.vhParticipant.linkedParticipants.map(lp => lp.linkedId).includes(p.id)
        );
        return linkedParticipants.some(lp => lp.hearing_role.toUpperCase() === HearingRole.WITNESS.toUpperCase());
    }

    disconnect() {
        if (this.connected) {
            this.videoCallService.disconnectFromCall();
        }
        this.callStream = null;
        this.outgoingStream = null;
        this.connected = false;
        this.setShowVideo(false);
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

    handleCallConnected(callConnected: ConnectedCall): void {
        this.errorCount = 0;
        this.connected = true;
        this.logger.debug(`${this.loggerPrefix} Successfully connected to hearing`, { conference: this.conferenceId });
        this.callStream = callConnected.stream;

        if (this.callStream) {
            this.updateShowVideo();
        }
        if (this.hearingControls && !this.audioOnly && this.hearingControls.videoMuted) {
            this.hearingControls.toggleVideoMute();
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

        if (error.reason.toUpperCase().includes('FAILED TO GATHER IP ADDRESSES')) {
            // This error happens when the Pexip connection isn't completely set up
            this.logger.debug(`${this.loggerPrefix} Failed to gather IP addresses, retrying`);
            this.connectionFailedCount++;

            if (this.connectionFailedCount < this.CONNECTION_FAILED_LIMIT) {
                // Suppress the error, in order to trigger another connection setup
                return;
            }

            this.logger.warn(`${this.loggerPrefix} Failed to gather IP addresses, retry limit reached`);
        }

        this.errorService.handlePexipError(error, this.conferenceId);
    }

    handleCallDisconnect(reason: DisconnectedCall): void {
        this.connected = false;
        this.updateShowVideo();
        this.logger.warn(`${this.loggerPrefix} Disconnected from pexip. Reason : ${reason.reason}`);
        if (!this.hearing.isPastClosedTime()) {
            this.logger.warn(`${this.loggerPrefix} Attempting to reconnect to pexip in ${this.CALL_TIMEOUT}ms`);
            this.callbackTimeout = window.setTimeout(async () => {
                await this.loadConferenceAndUpdateVideo();
                this.call();
            }, this.CALL_TIMEOUT);
        }
    }

    handleCallTransfer(): void {
        this.callStream = null;
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
            if (this.isHost() && this.participant.status === ParticipantStatus.InConsultation) {
                this.notificationToastrService.showHearingStarted(this.conference.id, this.participant.id);
            }
        }

        if (message.status === ConferenceStatus.Closed) {
            this.getConferenceClosedTime(this.hearing.id);
        }

        // Countdown only starts when hearing status becomes "In Session". The countdown cannot be considered complete
        // when the hearing status changes to any other as there is no countdown. So it should always reset to false on
        // status changes
        this.countdownComplete = false;
        this.presentationStream = null;
        this.videoCallService.stopScreenShare();
    }

    shouldMuteHearing(): boolean {
        return !(this.shouldUnmuteForHearing() || this.shouldUnmuteForConsultation());
    }

    shouldUnmuteForHearing(): boolean {
        return this.participant.status === ParticipantStatus.InHearing && this.hearing.status === ConferenceStatus.InSession;
    }

    shouldUnmuteForConsultation(): boolean {
        return this.participant.status === ParticipantStatus.InConsultation && !this.hasTriedToLeaveConsultation;
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage): void {
        if (!this.validateIsForConference(message.conferenceId)) {
            return;
        }
        const currentConferenceParticipants = this.hearing.getConference().participants;
        const participant = currentConferenceParticipants.find(p => p.id === message.participantId);
        const isMe = this.participant.id === participant.id;
        if (isMe) {
            this.participant.status = message.status;
            this.isTransferringIn = false;
        }
        participant.status = message.status;
        this.logger.debug(`${this.conferenceId} ${this.loggerPrefix} Handling participant update status change`, {
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
        if (!this.hasAHostInHearing(currentConferenceParticipants)) {
            this.isTransferringIn = false;
        }
    }

    handleLocalAudioVideoMuteStatus(message: ParticipantMediaStatusMessage) {
        if (!this.validateIsForConference(message.conferenceId)) {
            return;
        }
        this.participantRemoteMuteStoreService.updateLocalMuteStatus(
            message.participantId,
            message.mediaStatus.is_local_audio_muted,
            message.mediaStatus.is_local_video_muted
        );
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
            this.logger.debug(`${this.loggerPrefix} updating transfer status`, {
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
    }

    handleHearingDetailsUpdated(hearingDetailsUpdatedMessage: HearingDetailsUpdatedMessage) {
        if (!this.validateIsForConference(hearingDetailsUpdatedMessage.conference.id)) {
            return;
        }
        hearingDetailsUpdatedMessage.conference.scheduled_date_time = new Date(hearingDetailsUpdatedMessage.conference.scheduled_date_time);
        this.setConference(hearingDetailsUpdatedMessage.conference);
    }

    async onConsultationCancelled() {
        const logPayload = {
            conference: this.conferenceId,
            caseName: this.conference.case_name,
            participant: this.participant.id
        };
        this.logger.info(`${this.loggerPrefix} Participant is attempting to leave the private consultation`, logPayload);
        try {
            this.hasTriedToLeaveConsultation = true;
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
        this.hasTriedToLeaveConsultation = false;
        await this.consultationService.joinJudicialConsultationRoom(this.conference, this.participant);
    }

    async leaveJudicialConsultation() {
        this.logger.info(`${this.loggerPrefix} attempting to leave a private judicial consultation`, {
            conference: this.conference?.id,
            participant: this.participant.id
        });
        this.hasTriedToLeaveConsultation = true;
        await this.consultationService.leaveConsultation(this.conference, this.participant);
    }

    resetVideoFlags() {
        this.setShowVideo(false);
        this.showConsultationControls = false;
        this.isPrivateConsultation = false;
    }

    willShowHearing() {
        if (this.hearing.isInSession() && this.shouldCurrentUserJoinHearing()) {
            this.displayDeviceChangeModal = false;
            this.setShowVideo(true);
            this.showConsultationControls = false;
            this.isPrivateConsultation = false;
            return true;
        }
        return false;
    }

    willShowConsultation(): boolean {
        if (this.participant.status === ParticipantStatus.InConsultation) {
            this.displayDeviceChangeModal = false;
            this.setShowVideo(true);
            this.isPrivateConsultation = true;
            this.showConsultationControls = !this.isAdminConsultation;

            return true;
        }
        return false;
    }

    updateShowVideo(): void {
        const logPayload = {
            conference: this.conferenceId,
            caseName: this.conference.case_name,
            participant: this.participant.id,
            showingVideo: false,
            reason: ''
        };
        if (!this.connected) {
            logPayload.showingVideo = false;
            logPayload.reason = 'Not showing video because not connecting to pexip node';
            this.logger.debug(`${this.loggerPrefix} ${logPayload.reason}`, logPayload);
            this.resetVideoFlags();
            return;
        }

        if (this.willShowHearing()) {
            logPayload.showingVideo = true;
            logPayload.reason = 'Showing video because hearing is in session';
            this.logger.debug(`${this.loggerPrefix} ${logPayload.reason}`, logPayload);
            return;
        }

        if ((this.isOrHasWitnessLink() || this.isQuickLinkParticipant()) && this.participant.status === ParticipantStatus.InHearing) {
            logPayload.showingVideo = true;
            logPayload.reason = 'Showing video because witness is in hearing';
            this.logger.debug(`${this.loggerPrefix} ${logPayload.reason}`, logPayload);
            this.displayDeviceChangeModal = false;
            this.setShowVideo(true);
            this.showConsultationControls = false;
            this.isPrivateConsultation = false;
            return;
        }

        if (this.willShowConsultation()) {
            logPayload.showingVideo = true;
            logPayload.reason = 'Showing video because participant is in a consultation';
            this.logger.debug(`${this.loggerPrefix} ${logPayload.reason}`, logPayload);
            return;
        }

        logPayload.showingVideo = false;
        logPayload.reason = 'Not showing video because hearing is not in session and user is not in consultation';
        this.logger.debug(`${this.loggerPrefix} ${logPayload.reason}`, logPayload);
        this.conferenceStartedBy = null;
        this.resetVideoFlags();
    }

    shouldCurrentUserJoinHearing(): boolean {
        return this.participant.status === ParticipantStatus.InHearing;
    }

    isHost(): boolean {
        return this.participant.role === Role.Judge || this.participant.role === Role.StaffMember;
    }

    hasAHostInHearing(participants: ParticipantResponse[]): boolean {
        return participants.some(p => (p.role === Role.Judge || p.role === Role.StaffMember) && p.status === ParticipantStatus.InHearing);
    }

    showChooseCameraDialog() {
        this.displayDeviceChangeModal = true;
    }

    onSelectMediaDeviceShouldClose() {
        this.displayDeviceChangeModal = false;
        // focusing on the div using scrolling method
        const elm = document.getElementById(this.SELECT_MEDIA_DEVICES_MODAL_DEFAULT_ELEMENT);
        elm?.scrollIntoView();
    }

    executeWaitingRoomCleanup() {
        this.logger.debug(`${this.loggerPrefix} - Clearing intervals and subscriptions for waiting room`, {
            conference: this.conference?.id
        });
        clearTimeout(this.callbackTimeout);
        this.disconnect();
        this.eventHubSubscription$.unsubscribe();
        this.videoCallSubscription$.unsubscribe();
        this.onDestroy$.next();
        this.onDestroy$.complete();

        this.roomClosingToastrService.clearToasts();

        this.store.dispatch(ConferenceActions.leaveConference({ conferenceId: this.vhConference?.id }));
    }

    subscribeToClock(): void {
        this.clockService
            .getClock()
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(time => {
                this.currentTime = time;
                this.checkIfHearingIsClosed();
                this.checkIfHearingIsStarting();
                this.showRoomClosingToast(time);
            });
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
            this.logger.info(`${this.loggerPrefix} Hearing is closed, returning to home page`);
            this.router.navigate([pageUrls.Home]);
        }
    }

    checkIfHearingIsStarting(): void {
        if (this.hearing.isStarting() && !this.hearingStartingAnnounced) {
            this.announceHearingIsAboutToStart();
        }
    }

    announceHearingIsAboutToStart(): void {
        this.hearingStartingAnnounced = true;
        this.notificationSoundsService.playHearingAlertSound();
    }

    closeAllPCModals(): void {
        this.consultationService.clearModals();
    }

    showLeaveConsultationModal(): void {
        this.consultationService.displayConsultationLeaveModal();
        // focusing on the button
        const elm = document.getElementById(this.CONSULATION_LEAVE_MODAL_DEFAULT_ELEMENT);
        elm.focus();
    }

    switchStreamWindows(): void {
        this.streamInMain = !this.streamInMain;
    }

    videoClosedExt() {
        /// This is overriden in the child judge waiting room component
        this.logger.debug(`${this.loggerPrefix} video closed`);
    }

    async loadConferenceAndUpdateVideo(): Promise<void> {
        this.getConference().then(() => this.updateShowVideo());
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

    protected validateIsForConference(conferenceId: string): boolean {
        if (conferenceId !== this.hearing.id) {
            this.logger.debug(`${this.loggerPrefix} message not for current conference`);
            return false;
        }
        return true;
    }

    private setShowVideo(showVideo: boolean) {
        this.showVideo = showVideo;
        this.hideComponentsService.hideNonVideoComponents$.next(showVideo);
        if (showVideo === false) {
            this.videoClosedExt();
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

    private handleMyConsultationResponse(answer: ConsultationAnswer, requestedFor: string, responseInitiatorId: string, roomLabel: string) {
        if (answer === ConsultationAnswer.Accepted && requestedFor === responseInitiatorId) {
            this.hasTriedToLeaveConsultation = false;
            this.onConsultationAccepted(roomLabel);
        } else if (answer === ConsultationAnswer.Transferring) {
            this.onTransferingToConsultation(roomLabel);
        } else if (requestedFor === responseInitiatorId) {
            this.onConsultationRejected(roomLabel);
        }
    }

    private handleParticipantsUpdatedMessage(participantsUpdatedMessage: ParticipantsUpdatedMessage) {
        this.logger.debug('[WR] - Participants updated message recieved', participantsUpdatedMessage.participants);
        if (!this.validateIsForConference(participantsUpdatedMessage.conferenceId)) {
            return;
        }

        const currentParticipantInConference = participantsUpdatedMessage.participants.find(p => p.id === this.participant.id);
        if (!currentParticipantInConference) {
            this.logger.info(`${this.loggerPrefix} Participant not found in conference, returning to home page`, {
                conference: this.conferenceId,
                participant: this.participant.id,
                payloadConferenceId: participantsUpdatedMessage.conferenceId,
                payloadParticipants: participantsUpdatedMessage.participants
            });
            return this.router.navigate([pageUrls.Home]);
        }

        const newParticipants = participantsUpdatedMessage.participants.filter(x => !this.conference.participants.find(y => y.id === x.id));

        newParticipants.forEach(participant => {
            this.logger.debug('[WR] - Participant added, showing notification', participant);
            this.notificationToastrService.showParticipantAdded(
                participant,
                this.participant.status === ParticipantStatus.InHearing || this.participant.status === ParticipantStatus.InConsultation
            );
        });

        const updatedParticipantsList = [...participantsUpdatedMessage.participants].map(participant => {
            const currentParticipant = this.conference.participants.find(x => x.id === participant.id);
            participant.current_room = currentParticipant ? currentParticipant.current_room : null;
            participant.status = currentParticipant ? currentParticipant.status : ParticipantStatus.NotSignedIn;
            participant.display_name ??= currentParticipant.display_name;
            return participant;
        });
        this.conference = { ...this.conference, participants: updatedParticipantsList } as ConferenceResponse;
        this.hearing.getConference().participants = updatedParticipantsList;
        this.participant = this.getLoggedParticipant();
    }

    private handleEndpointsUpdatedMessage(endpointsUpdatedMessage: EndpointsUpdatedMessage) {
        this.logger.debug('[WR] - Endpoints updated message received', {
            newEndpoints: endpointsUpdatedMessage.endpoints.new_endpoints,
            updatedEndpoints: endpointsUpdatedMessage.endpoints.existing_endpoints
        });

        if (!this.validateIsForConference(endpointsUpdatedMessage.conferenceId)) {
            return;
        }

        endpointsUpdatedMessage.endpoints.existing_endpoints.forEach((endpoint: VideoEndpointResponse) => {
            this.hearing.updateEndpoint(endpoint);
        });

        this.conference = { ...this.conference, endpoints: [...this.hearing.getEndpoints()] } as ConferenceResponse;
    }

    private setConference(conferenceResponse: ConferenceResponse) {
        this.errorCount = 0;
        this.loadingData = false;
        this.countdownComplete = conferenceResponse.status === ConferenceStatus.InSession;
        this.hearing = new Hearing(conferenceResponse);
        this.conference = this.hearing.getConference();
    }
}
