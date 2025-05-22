import { AfterContentChecked, Directive, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject, Subscription, combineLatest, of } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { ConsultationAnswer, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { TransferDirection } from 'src/app/services/models/hearing-transfer';
import { vhContactDetails } from 'src/app/shared/contact-information';
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
import { NotificationToastrService } from '../services/notification-toastr.service';
import { RoomClosingToastrService } from '../services/room-closing-toast.service';
import { VideoCallService } from '../services/video-call.service';
import { HideComponentsService } from '../services/hide-components.service';
import { FocusService } from 'src/app/services/focus.service';
import { convertStringToTranslationId } from 'src/app/shared/translation-id-converter';
import { ConferenceState } from '../store/reducers/conference.reducer';
import { Store } from '@ngrx/store';
import { VHConference, VHEndpoint, VHParticipant, VHRoom } from '../store/models/vh-conference';
import * as ConferenceSelectors from '../store/selectors/conference.selectors';
import { FEATURE_FLAGS } from 'src/app/services/launch-darkly.service';
import { ConferenceActions } from '../store/actions/conference.actions';
import { VHHearing } from 'src/app/shared/models/hearing.vh';
import { ParticipantHelper } from 'src/app/shared/participant-helper';
import { VideoCallEventsService } from '../services/video-call-events.service';

@Directive()
export abstract class WaitingRoomBaseDirective implements AfterContentChecked {
    @ViewChild('roomTitleLabel', { static: false }) roomTitleLabel: ElementRef<HTMLDivElement>;
    @ViewChild('hearingControls', { static: false }) hearingControls: PrivateConsultationRoomControlsComponent;

    maxBandwidth = null;
    audioOnly: boolean;
    privateConsultationAccordianExpanded = false;
    loadingData: boolean;
    errorCount: number;
    hearing: VHHearing;
    vhConference: VHConference;
    vhParticipant: VHParticipant;
    participantEndpoints: VHEndpoint[] = [];
    conferenceRooms: VHRoom[] = [];

    videoCallSubscription$ = new Subscription();
    currentTime: Date;

    callStream: MediaStream | URL;
    connected: boolean;
    outgoingStream: MediaStream | URL;
    presentationStream: MediaStream | URL;

    showVideo: boolean;
    isTransferringIn: boolean;
    isPrivateConsultation: boolean;
    showConsultationControls: boolean;
    displayDeviceChangeModal: boolean;
    displayStartPrivateConsultationModal: boolean;
    displayJoinPrivateConsultationModal: boolean;
    conferenceStartedBy: string;
    phoneNumber$: Observable<string>;
    hasCaseNameOverflowed = false;
    featureFlags = FEATURE_FLAGS;

    divTrapId: string;

    CALL_TIMEOUT = 31000; // 31 seconds
    callbackTimeout: ReturnType<typeof setTimeout> | number;

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
        protected eventService: EventsService,
        protected logger: Logger,
        protected errorService: ErrorService,
        protected videoCallService: VideoCallService,
        protected deviceTypeService: DeviceTypeService,
        protected router: Router,
        protected consultationService: ConsultationService,
        protected notificationToastrService: NotificationToastrService,
        protected roomClosingToastrService: RoomClosingToastrService,
        protected clockService: ClockService,
        protected consultationInvitiationService: ConsultationInvitationService,
        protected hideComponentsService: HideComponentsService,
        protected focusService: FocusService,
        protected store: Store<ConferenceState>,
        protected videoCallEventsService: VideoCallEventsService
    ) {
        this.store
            .select(ConferenceSelectors.getAvailableRooms)
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(rooms => (this.conferenceRooms = rooms));
        this.loadingData = true;
        this.setShowVideo(false);
        this.showConsultationControls = false;
        this.isPrivateConsultation = false;
        this.errorCount = 0;
        this.connectionFailedCount = 0;

        const activeConference$ = this.store.select(ConferenceSelectors.getActiveConference);
        const loggedInParticipant$ = this.store.select(ConferenceSelectors.getLoggedInParticipant);

        combineLatest([activeConference$, loggedInParticipant$])
            .pipe(
                takeUntil(this.onDestroy$),
                filter(([activeConference, participant]) => !!activeConference && !!participant)
            )
            .subscribe(([conf, participant]) => {
                this.handleStoreChanges(conf, participant);
            });
    }

    get showExtraContent(): boolean {
        return !this.showVideo && !this.isTransferringIn;
    }

    get conferenceId(): string {
        return this.vhConference?.id;
    }

    get numberOfJudgeOrJOHsInConsultation(): number {
        return this.vhConference.participants.filter(
            x =>
                (x.role === Role.Judge || x.role === Role.JudicialOfficeHolder) &&
                x.status === ParticipantStatus.InConsultation &&
                x.room?.label.toLowerCase().startsWith('judgejohconsultationroom')
        ).length;
    }

    get isSupportedBrowserForNetworkHealth(): boolean {
        return this.deviceTypeService.isSupportedBrowserForNetworkHealth();
    }

    get isParticipantInConference(): boolean {
        return (
            this.vhParticipant?.status === ParticipantStatus.InHearing || this.vhParticipant?.status === ParticipantStatus.InConsultation
        );
    }

    get isStaffMember(): boolean {
        return ParticipantHelper.isStaffMember(this.vhParticipant);
    }

    ngAfterContentChecked(): void {
        this.checkCaseNameOverflow();
    }

    handleStoreChanges(conf: VHConference, participant: VHParticipant) {
        this.countdownComplete = conf.countdownComplete;
        this.loadingData = false;

        this.vhConference = conf;
        this.hearing = new VHHearing(conf);

        // this does not need to be an observable and we can move away from the flag service
        this.phoneNumber$ = this.vhConference.isVenueScottish
            ? of(this.contactDetails.scotland.phoneNumber)
            : of(this.contactDetails.englandAndWales.phoneNumber);
        this.vhParticipant = participant;
        this.isTransferringIn = this.vhParticipant.transferDirection === TransferDirection.In;
        this.participantEndpoints = this.filterEndpoints(conf.endpoints, participant);

        this.updateShowVideo();
    }

    filterEndpoints(endpoints: VHEndpoint[], participant: VHParticipant): VHEndpoint[] {
        const hostRoles = [Role.Judge, Role.StaffMember];
        let filtered: VHEndpoint[] = [];
        if (hostRoles.includes(participant.role)) {
            filtered = endpoints;
        } else {
            filtered = endpoints.filter(endpoint => endpoint.participantsLinked.includes(participant.username?.toLowerCase()));
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
            this.vhParticipant.status === ParticipantStatus.Available &&
            (!this.vhParticipant.room || this.vhParticipant.room.label === 'WaitingRoom')
        );
    }

    getLoggedParticipant(): VHParticipant {
        return this.vhParticipant;
    }

    stringToTranslateId(str: string) {
        return convertStringToTranslationId(str);
    }

    getCaseNameAndNumber() {
        return `${this.vhConference.caseName}: ${this.vhConference.caseNumber}`;
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

    onLinkedParticiantRejectedConsultationInvite(linkedParticipant: VHParticipant, consulationRoomLabel: string) {
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
            linkedParticipant.displayName,
            invitation.invitedByName,
            this.vhParticipant.status === ParticipantStatus.InHearing
        );
    }

    onTransferingToConsultation(roomLabel: string) {
        this.consultationInvitiationService.removeInvitation(roomLabel);
    }

    onConsultationRejected(roomLabel: string) {
        this.consultationInvitiationService.removeInvitation(roomLabel);
    }

    startEventHubSubscribers() {
        this.eventService
            .getConsultationRequestResponseMessage()
            .pipe(
                takeUntil(this.onDestroy$),
                filter(message => !!message && message.conferenceId === this.vhConference.id)
            )
            .subscribe(message => {
                if (message.requestedFor === this.vhParticipant.id) {
                    this.handleMyConsultationResponse(message.answer, message.requestedFor, message.responseInitiatorId, message.roomLabel);
                } else {
                    this.handleLinkedParticipantConsultationResponse(
                        message.answer,
                        message.requestedFor,
                        message.responseInitiatorId,
                        message.roomLabel
                    );
                }
            });

        this.eventService
            .getServiceDisconnected()
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(attemptNumber => {
                this.handleEventHubDisconnection(attemptNumber);
            });

        this.eventService
            .getServiceConnected()
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(() => {
                this.logger.debug(`${this.loggerPrefix} EventHub re-connected`, {
                    conference: this.vhConference.id,
                    participant: this.vhParticipant.id
                });
                this.updateShowVideo();
            });

        this.eventService
            .getHearingStatusMessage()
            .pipe(
                takeUntil(this.onDestroy$),
                filter(x => x.conferenceId === this.vhConference?.id)
            )
            .subscribe(() => this.handleConferenceStatusChange());
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
                    waitingOnLinkedParticipants.push(this.findParticipant(linkedParticipantId)?.displayName);
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
                this.vhParticipant.status === ParticipantStatus.InHearing
            );
        }
    }

    handleEventHubDisconnection(reconnectionAttempt: number) {
        const logPayload = {
            conference: this.vhConference.id,
            participant: this.vhParticipant.id,
            connectionAttempt: reconnectionAttempt
        };
        if (reconnectionAttempt < 7) {
            this.logger.debug(`${this.loggerPrefix} EventHub disconnection`, logPayload);
            this.store.dispatch(ConferenceActions.loadConference({ conferenceId: this.vhConference?.id }));
        }
    }

    async connectToPexip(): Promise<void> {
        const logPayload = {
            conference: this.vhConference.id,
            participant: this.vhParticipant.id
        };
        try {
            await this.setupPexipEventSubscriptionAndClient();
            await this.call();

            this.eventService
                .onEventsHubReady()
                .pipe(takeUntil(this.onDestroy$))
                .subscribe(() => {
                    this.logger.debug(`${this.loggerPrefix} EventHub ready`, {
                        conference: this.conferenceId,
                        participant: this.vhParticipant.id
                    });
                    this.updateShowVideo();
                });
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

        await this.videoCallService.setupClient(this.vhConference.supplier);
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
            participant: this.vhParticipant.id,
            reason: discconnectedPresentation.reason
        };
        this.logger.warn(`${this.loggerPrefix} Presentation disconnected`, logPayload);
        this.presentationStream = null;
        this.videoCallService.stopPresentation();
    }

    handlePresentationConnected(connectedPresentation: ConnectedPresentation): void {
        const logPayload = {
            conference: this.conferenceId,
            participant: this.vhParticipant.id
        };
        this.logger.debug(`${this.loggerPrefix} Successfully connected to presentation`, logPayload);
        this.presentationStream = connectedPresentation.stream;
    }

    getConference() {
        this.store.dispatch(ConferenceActions.loadConference({ conferenceId: this.conferenceId }));
    }

    async call() {
        if (!this.eventService.eventHubIsConnected) {
            this.logger.warn(`${this.loggerPrefix} EventHub is not connected, waiting for connection before it makes a call to pexip`);
            return;
        }

        const logPayload = {
            conference: this.conferenceId,
            participant: this.vhParticipant.id
        };
        this.logger.debug(`${this.loggerPrefix} calling pexip`, logPayload);
        const pexipNode = this.hearing.getConference().pexipNodeUri;
        const conferenceAlias = this.hearing.getConference().conferenceAlias;
        const displayName = this.vhParticipant.tiledDisplayName;

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
        if (this.vhParticipant?.hearingRole?.toUpperCase() === HearingRole.WITNESS.toUpperCase()) {
            return true;
        }
        if (this.vhParticipant?.hearingRole.toUpperCase() === HearingRole.EXPERT.toUpperCase()) {
            return true;
        }
        if (!this.vhParticipant?.linkedParticipants.length) {
            return false;
        }
        const linkedParticipants = this.vhConference.participants.filter(p =>
            this.vhParticipant.linkedParticipants.map(lp => lp.linkedId).includes(p.id)
        );
        return linkedParticipants.some(lp => lp.hearingRole.toUpperCase() === HearingRole.WITNESS.toUpperCase());
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
            participant: this.vhParticipant.id
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
    }

    handleCallError(error: CallError): void {
        this.errorCount++;
        this.connected = false;
        this.updateShowVideo();
        this.logger.error(`${this.loggerPrefix} Error from pexip. Reason : ${error.reason}`, new Error(error.reason), {
            pexipError: error,
            conference: this.conferenceId,
            participant: this.vhParticipant.id
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
                this.updateShowVideo();
                await this.call();
            }, this.CALL_TIMEOUT);
        }
    }

    handleCallTransfer(): void {
        this.callStream = null;
    }

    handleConferenceStatusChange() {
        this.presentationStream = null;
        this.videoCallService.stopScreenShare();
    }

    async onConsultationCancelled() {
        const logPayload = {
            conference: this.conferenceId,
            caseName: this.vhConference.caseName,
            participant: this.vhParticipant.id
        };
        this.logger.info(`${this.loggerPrefix} Participant is attempting to leave the private consultation`, logPayload);
        try {
            this.hasTriedToLeaveConsultation = true;
            await this.consultationService.leaveConsultation(this.vhConference.id, this.vhParticipant.id);
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Failed to leave private consultation`, error, logPayload);
        }
    }

    async joinJudicialConsultation() {
        this.logger.info(`${this.loggerPrefix} attempting to join a private judicial consultation`, {
            conference: this.vhConference?.id,
            participant: this.vhParticipant.id
        });
        this.hasTriedToLeaveConsultation = false;
        await this.consultationService.joinJudicialConsultationRoom(this.vhConference.id, this.vhParticipant.id);
    }

    async leaveJudicialConsultation() {
        this.logger.info(`${this.loggerPrefix} attempting to leave a private judicial consultation`, {
            conference: this.vhConference?.id,
            participant: this.vhParticipant.id
        });
        this.hasTriedToLeaveConsultation = true;
        await this.consultationService.leaveConsultation(this.vhConference.id, this.vhParticipant.id);
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
        if (this.vhParticipant.status === ParticipantStatus.InConsultation) {
            this.displayDeviceChangeModal = false;
            this.setShowVideo(true);
            this.isPrivateConsultation = true;
            this.showConsultationControls = true;

            return true;
        }
        return false;
    }

    updateShowVideo(): void {
        const logPayload = {
            conference: this.conferenceId,
            caseName: this.vhConference.caseName,
            participant: this.vhParticipant.id,
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

        if ((this.isOrHasWitnessLink() || this.isQuickLinkParticipant()) && this.vhParticipant.status === ParticipantStatus.InHearing) {
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
        return this.vhParticipant.status === ParticipantStatus.InHearing;
    }

    /** @deprecated this does not look to be used by the component any longer. verify and remove */
    isHost(): boolean {
        return this.vhParticipant.role === Role.Judge || this.vhParticipant.role === Role.StaffMember;
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
            conference: this.vhConference?.id
        });
        clearTimeout(this.callbackTimeout);
        this.disconnect();
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

    closeAllPCModals(): void {
        this.consultationService.clearModals();
    }

    showLeaveConsultationModal(): void {
        this.consultationService.displayConsultationLeaveModal();
        // focusing on the button
        const elm = document.getElementById(this.CONSULATION_LEAVE_MODAL_DEFAULT_ELEMENT);
        elm?.focus();
    }

    protected findParticipant(participantId: string): VHParticipant {
        return this.vhConference.participants.find(x => x.id === participantId);
    }

    protected findParticipantsInRoom(roomLabel: string): VHParticipant[] {
        return this.vhConference.participants.filter(x => x.room?.label === roomLabel);
    }

    protected findEndpointsInRoom(roomLabel: string): VHEndpoint[] {
        return this.vhConference.endpoints.filter(x => x.room?.label === roomLabel);
    }

    private setShowVideo(showVideo: boolean) {
        this.showVideo = showVideo;
        this.hideComponentsService.hideNonVideoComponents$.next(showVideo);
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
        return !!this.vhParticipant.linkedParticipants.find(linkedParticipant => requestedFor === linkedParticipant.linkedId);
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
}
