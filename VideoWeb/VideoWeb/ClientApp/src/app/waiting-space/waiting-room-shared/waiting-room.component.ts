import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { ConferenceStatus, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { DeviceTypeService } from '../../services/device-type.service';
import { HearingRole } from '../models/hearing-role-model';
import { NotificationToastrService } from '../services/notification-toastr.service';
import { RoomClosingToastrService } from '../services/room-closing-toast.service';
import { VideoCallService } from '../services/video-call.service';
import { WaitingRoomBaseDirective } from '../waiting-room-shared/waiting-room-base.component';
import { TranslateService } from '@ngx-translate/core';
import { ConsultationInvitationService } from '../services/consultation-invitation.service';
import { filter, take, takeUntil } from 'rxjs/operators';
import { UnloadDetectorService } from 'src/app/services/unload-detector.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { ParticipantMediaStatus } from 'src/app/shared/models/participant-media-status';
import { ConferenceActions } from '../store/actions/conference.actions';
import { ModalTrapFocus } from '../../shared/modal/modal-trap-focus';
import { HideComponentsService } from '../services/hide-components.service';
import { FocusService } from 'src/app/services/focus.service';
import { ConferenceState } from '../store/reducers/conference.reducer';
import { Store } from '@ngrx/store';
import { VHParticipant } from '../store/models/vh-conference';
import { WaitingRoomUserRole } from './models/waiting-room-user-role';
import { VideoCallEventsService } from '../services/video-call-events.service';
import { AudioRecordingService } from 'src/app/services/audio-recording.service';
import { VideoCallHostActions } from '../store/actions/video-call-host.actions';
import { CallError } from '../models/video-call-models';
import { getCountdownComplete } from '../store/selectors/conference.selectors';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';

@Component({
    standalone: false,
    selector: 'app-waiting-room',
    templateUrl: './waiting-room.component.html',
    styleUrls: ['../waiting-room-global-styles.scss', './waiting-room.component.scss']
})
export class WaitingRoomComponent extends WaitingRoomBaseDirective implements OnInit, OnDestroy {
    @Input() userRole: WaitingRoomUserRole;
    UserRole = WaitingRoomUserRole;

    currentTime: Date;

    showJoinHearingWarning = false;
    displayLanguageModal: boolean;
    displayLeaveHearingPopup = false;
    displayConfirmStartHearingPopup: boolean;
    displayJoinHearingPopup: boolean;
    audioErrorRetryToast: VhToastComponent;
    continueWithNoRecording = false;
    recordingPaused: boolean;
    unreadMessageCount = 0;

    private readonly componentLoggerPrefix = '[Waiting Room] -';
    private destroyedSubject = new Subject();

    constructor(
        protected route: ActivatedRoute,
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
        protected translateService: TranslateService,
        protected consultationInvitiationService: ConsultationInvitationService,
        private unloadDetectorService: UnloadDetectorService,
        protected userMediaService: UserMediaService,
        protected hideComponentsService: HideComponentsService,
        protected focusService: FocusService,
        protected store: Store<ConferenceState>,
        protected videoCallEventsService: VideoCallEventsService,
        private readonly audioRecordingService: AudioRecordingService
    ) {
        super(
            route,
            eventService,
            logger,
            errorService,
            videoCallService,
            deviceTypeService,
            router,
            consultationService,
            notificationToastrService,
            roomClosingToastrService,
            clockService,
            consultationInvitiationService,
            hideComponentsService,
            focusService,
            store,
            videoCallEventsService
        );
    }

    get allowAudioOnlyToggle(): boolean {
        if (this.isParticipant) {
            return true;
        }

        return (
            !!this.vhConference &&
            !!this.vhParticipant &&
            this.vhParticipant?.status !== ParticipantStatus.InConsultation &&
            this.vhParticipant?.status !== ParticipantStatus.InHearing
        );
    }

    get isObserver(): boolean {
        return this.vhParticipant?.hearingRole === HearingRole.OBSERVER;
    }

    get isQuickLinkObserver(): boolean {
        return this.vhParticipant?.role === Role.QuickLinkObserver;
    }

    get isQuickLinkUser(): boolean {
        return (
            this.vhParticipant?.hearingRole?.toUpperCase() === HearingRole.QUICK_LINK_OBSERVER.toUpperCase() ||
            this.vhParticipant?.hearingRole?.toUpperCase() === HearingRole.QUICK_LINK_PARTICIPANT.toUpperCase()
        );
    }

    get isVictim(): boolean {
        return this.vhParticipant?.hearingRole === HearingRole.VICTIM;
    }

    get isPolice(): boolean {
        return this.vhParticipant?.hearingRole === HearingRole.POLICE;
    }

    get canStartJoinConsultation() {
        return (
            !this.isOrHasWitnessLink() &&
            !this.isObserver &&
            this.vhParticipant?.hearingRole !== HearingRole.OBSERVER &&
            !this.isQuickLinkObserver &&
            !this.vhParticipant.linkedParticipants.length &&
            !this.isVictim &&
            !this.isPolice
        );
    }

    get isJoh(): boolean {
        return this.userRole === WaitingRoomUserRole.Joh;
    }

    get isParticipant(): boolean {
        return this.userRole === WaitingRoomUserRole.Participant;
    }

    get canShowHearingLayoutSelection() {
        return !this.hearing.isClosed() && !this.hearing.isInSession();
    }

    videoClosedExt() {
        this.audioErrorRetryToast?.remove();
        this.audioErrorRetryToast = null;
    }

    ngOnInit() {
        this.setTitle();
        this.divTrapId = 'video-container';
        this.init();
    }

    ngOnDestroy(): void {
        this.cleanUp();
    }

    subscribeToClock(): void {
        this.clockService
            .getClock()
            .pipe(takeUntil(this.destroyedSubject))
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
            this.router.navigate([pageUrls.ParticipantHearingList]);
        }
    }

    getConferenceStatusText(): string {
        if (this.userRole === WaitingRoomUserRole.Participant) {
            return this.getConferenceStatusTextForParticipant();
        } else if (this.userRole === WaitingRoomUserRole.Judge) {
            return this.getConferenceStatusTextForJudge();
        }

        if (this.hearing.getConference().status === ConferenceStatus.NotStarted) {
            return '';
        } else if (this.hearing.isSuspended()) {
            return this.translateService.instant('waiting-room.is-suspended');
        } else if (this.hearing.isPaused()) {
            return this.translateService.instant('waiting-room.is-paused');
        } else if (this.hearing.isClosed()) {
            return this.translateService.instant('waiting-room.is-closed');
        }
        return this.translateService.instant('waiting-room.is-in-session');
    }

    getConferenceStatusTextForParticipant(): string {
        if (this.hearing.getConference().status === ConferenceStatus.NotStarted) {
            if (this.hearing.isStarting()) {
                return this.translateService.instant('waiting-room.is-about-to-begin');
            } else if (this.hearing.isDelayed()) {
                return this.translateService.instant('waiting-room.is-delayed');
            } else {
                return '';
            }
        } else if (this.hearing.isSuspended()) {
            return this.translateService.instant('waiting-room.is-suspended');
        } else if (this.hearing.isPaused()) {
            return this.translateService.instant('waiting-room.is-paused');
        } else if (this.hearing.isClosed()) {
            return this.translateService.instant('waiting-room.is-closed');
        }
        return this.translateService.instant('waiting-room.is-in-session');
    }

    getConferenceStatusTextForJudge() {
        switch (this.vhConference.status) {
            case ConferenceStatus.NotStarted:
                return this.translateService.instant('waiting-room.start-this-hearing');
            case ConferenceStatus.Suspended:
                return this.translateService.instant('waiting-room.hearing-suspended');
            case ConferenceStatus.Paused:
                return this.translateService.instant('waiting-room.hearing-paused');
            case ConferenceStatus.Closed:
                return this.translateService.instant('waiting-room.hearing-is-closed');
            default:
                return this.translateService.instant('waiting-room.hearing-is-in-session');
        }
    }

    getRoomName(): string {
        return this.consultationService.consultationNameToString(this.vhParticipant?.room?.label, false);
    }

    openStartConsultationModal() {
        this.displayStartPrivateConsultationModal = true;
    }

    openJoinConsultationModal() {
        this.displayJoinPrivateConsultationModal = true;
    }

    showLanguageChangeModal() {
        this.displayLanguageModal = true;
    }

    closeLanguageChangeModal() {
        this.displayLanguageModal = false;
    }

    getPrivateConsultationParticipants(): VHParticipant[] {
        return this.vhConference.participants.filter(
            p =>
                p.id !== this.vhParticipant.id &&
                p.role !== Role.JudicialOfficeHolder &&
                p.role !== Role.Judge &&
                p.role !== Role.StaffMember &&
                p.hearingRole !== HearingRole.OBSERVER &&
                p.hearingRole !== HearingRole.WITNESS &&
                !p.protectedFrom?.includes(this.vhParticipant.externalReferenceId) &&
                !this.vhParticipant.protectedFrom?.includes(p.externalReferenceId)
        );
    }

    async startPrivateConsultation(participants: string[], endpoints: string[]) {
        this.logger.info(`${this.componentLoggerPrefix} attempting to start a private participant consultation`, {
            conference: this.vhConference?.id,
            participant: this.vhParticipant.id
        });
        this.hasTriedToLeaveConsultation = false;
        await this.consultationService.createParticipantConsultationRoom(
            this.vhConference.id,
            this.vhParticipant.id,
            participants,
            endpoints
        );
        this.closeStartPrivateConsultationModal();
        this.privateConsultationAccordianExpanded = false;
    }

    async joinPrivateConsultation(roomLabel: string) {
        this.logger.info(`${this.componentLoggerPrefix} attempting to join a private participant consultation`, {
            conference: this.vhConference?.id,
            participant: this.vhParticipant.id,
            roomLabel: roomLabel
        });
        this.hasTriedToLeaveConsultation = false;
        await this.consultationService.joinPrivateConsultationRoom(this.vhConference.id, this.vhParticipant.id, roomLabel);
        this.closeJoinPrivateConsultationModal();
        this.privateConsultationAccordianExpanded = false;
    }

    async setRoomLock(lock: boolean) {
        const roomLabel = this.vhParticipant.room?.label;
        if (!roomLabel) {
            return;
        }

        this.logger.info(`${this.componentLoggerPrefix} attempting to set room lock state`, {
            conference: this.vhConference?.id,
            participant: this.vhParticipant.id,
            roomLabel: roomLabel,
            lock: lock
        });
        await this.consultationService.lockConsultation(this.vhConference.id, roomLabel, lock);
    }

    closeStartPrivateConsultationModal() {
        this.displayStartPrivateConsultationModal = false;
    }

    closeJoinPrivateConsultationModal() {
        this.displayJoinPrivateConsultationModal = false;
    }

    toggleAccordian() {
        this.privateConsultationAccordianExpanded = !this.privateConsultationAccordianExpanded;
    }

    setTrapFocus() {
        ModalTrapFocus.trap('video-container');
    }

    dismissJoinHearingWarning() {
        this.showJoinHearingWarning = false;
        this.setUpSubscribers();
    }

    onLeaveHearingButtonClicked() {
        this.displayLeaveHearingPopup = true;
    }

    leave(confirmation: boolean) {
        this.displayLeaveHearingPopup = false;
        if (!confirmation) {
            return;
        }
        const feedbackUrl = 'https://www.smartsurvey.co.uk/s/VideoHearings_Feedback/';
        window.location.assign(feedbackUrl);
    }

    init() {
        this.divTrapId = 'video-container';

        if (this.userRole === WaitingRoomUserRole.Judge) {
            this.initForJudge();
            return;
        }

        this.destroyedSubject = new Subject();

        this.unloadDetectorService.shouldUnload.pipe(takeUntil(this.destroyedSubject)).subscribe(() => this.onShouldUnload());
        this.unloadDetectorService.shouldReload.pipe(take(1)).subscribe(() => this.onShouldReload());

        this.errorCount = 0;
        this.logger.debug(`${this.componentLoggerPrefix} loading waiting room`);
        this.connected = false;
        this.getConference();
        if (this.deviceTypeService.isHandheldIOSDevice()) {
            this.showJoinHearingWarning = true;
        } else {
            this.setUpSubscribers();
        }
    }

    initForJudge() {
        if (!this.vhConference || !this.vhParticipant) {
            return;
        }

        this.errorCount = 0;
        this.logger.debug(`${this.componentLoggerPrefix} Loading judge waiting room`);
        this.loggedInUser = this.route.snapshot.data['loggedUser'];

        this.unloadDetectorService.shouldUnload.pipe(takeUntil(this.onDestroy$)).subscribe(() => this.onShouldUnload());
        this.unloadDetectorService.shouldReload.pipe(take(1)).subscribe(() => this.onShouldReload());

        try {
            this.logger.debug(`${this.componentLoggerPrefix} Defined default devices in cache`);
            this.connected = false;
            this.getConference();
            this.subscribeToClock();
            this.startEventHubSubscribers();
            this.connectToPexip();
        } catch (error) {
            this.logger.error(`${this.componentLoggerPrefix} Failed to initialise the judge waiting room`, error);
            const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
            this.errorService.handlePexipError(new CallError(error.name), conferenceId);
        }

        this.eventService
            .getAudioRestartActioned()
            .pipe(
                takeUntil(this.onDestroy$),
                filter(conferenceId => conferenceId === this.vhConference.id)
            )
            .subscribe(() => {
                if (this.audioErrorRetryToast) {
                    this.logger.warn(`${this.componentLoggerPrefix} Audio restart actioned by another host`);
                    this.audioErrorRetryToast.vhToastOptions.concludeToast(this.audioRestartCallback.bind(this));
                }
            });

        this.audioRecordingService
            .getAudioRecordingPauseState()
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((recordingPaused: boolean) => (this.recordingPaused = recordingPaused));

        this.audioRecordingService
            .getWowzaAgentConnectionState()
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((stateIsConnected: boolean) => (stateIsConnected ? this.onWowzaConnected() : this.onWowzaDisconnected()));

        this.store
            .select(getCountdownComplete)
            .pipe(
                takeUntil(this.onDestroy$),
                filter(complete => complete)
            )
            .subscribe(complete => {
                if (complete) {
                    this.logger.debug(`${this.componentLoggerPrefix} Hearing countdown complete`);
                    this.verifyAudioRecordingStream();
                }
            });

        this.startVideoCallEventSubscribers();
    }

    unreadMessageCounterUpdate(count: number) {
        this.unreadMessageCount = count;
    }

    defineIsIMEnabled(): boolean {
        if (!this.hearing) {
            return false;
        }
        if (this.vhParticipant.status === ParticipantStatus.InConsultation) {
            return false;
        }
        if (this.deviceTypeService.isIpad()) {
            return !this.showVideo;
        }
        return true;
    }

    hearingSuspended(): boolean {
        return this.vhConference.status === ConferenceStatus.Suspended;
    }

    isNotStarted(): boolean {
        return this.hearing.isNotStarted();
    }

    isPaused(): boolean {
        return this.hearing.isPaused() || this.hearing.isSuspended();
    }

    hearingPaused(): boolean {
        return this.vhConference.status === ConferenceStatus.Paused;
    }

    isHearingInSession(): boolean {
        return this.vhConference.status === ConferenceStatus.InSession;
    }

    displayConfirmStartPopup() {
        this.logger.debug(`${this.componentLoggerPrefix} Display start hearing confirmation popup`, {
            conference: this.conferenceId,
            status: this.vhConference.status
        });
        this.focusService.storeFocus();
        this.displayConfirmStartHearingPopup = true;
    }

    joinHearingClicked() {
        this.displayJoinPopup();
    }

    displayJoinPopup() {
        this.displayJoinHearingPopup = true;
    }

    onStartConfirmAnswered(actionConfirmed: boolean) {
        this.logger.debug(`${this.componentLoggerPrefix} Judge responded to start hearing confirmation`, {
            conference: this.conferenceId,
            status: this.vhConference.status,
            confirmStart: actionConfirmed
        });
        this.displayConfirmStartHearingPopup = false;
        if (actionConfirmed) {
            this.startHearing();
        } else {
            this.focusService.restoreFocus();
        }
    }

    startHearing() {
        this.audioRecordingService.restartActioned = false;
        this.logger.debug(`${this.componentLoggerPrefix} Judge clicked start/resume hearing`, {
            conference: this.conferenceId,
            status: this.vhConference.status
        });

        this.store.dispatch(VideoCallHostActions.startHearing({ conferenceId: this.conferenceId }));
    }

    onJoinConfirmAnswered(actionConfirmed: boolean) {
        this.logger.debug(`${this.componentLoggerPrefix} Judge responded to join hearing confirmation`, {
            conference: this.conferenceId,
            status: this.vhConference.status,
            confirmStart: actionConfirmed
        });
        this.displayJoinHearingPopup = false;
        if (actionConfirmed) {
            this.joinHearingInSession();
        }
    }

    joinHearingInSession() {
        this.store.dispatch(VideoCallHostActions.joinHearing({ conferenceId: this.vhConference.id, participantId: this.vhParticipant.id }));
    }

    audioRestartCallback(continueWithNoRecording: boolean) {
        this.continueWithNoRecording = continueWithNoRecording;
        this.audioErrorRetryToast = null;
    }

    verifyAudioRecordingStream() {
        /// If audio recording is required,
        // has not been confirmed by user, to continue without recording,
        // video is open,
        // the alert isn't open already,
        // Recording is not paused
        // and the audio streaming agent cannot be validated, then show the alert
        if (
            this.vhConference.audioRecordingRequired &&
            !this.continueWithNoRecording &&
            this.showVideo &&
            !this.audioErrorRetryToast &&
            !this.recordingPaused &&
            !this.audioRecordingService.wowzaAgent?.isAudioOnlyCall
        ) {
            this.logWowzaAlert();
            this.showAudioRecordingRestartAlert();
        }
    }

    private onShouldReload(): void {
        window.location.reload();
    }

    private onShouldUnload(): void {
        this.cleanUp();
    }

    private setUpSubscribers() {
        this.subscribeToClock();
        this.startEventHubSubscribers();
        this.connectToPexip();
        this.registerMediaStatusPublisher();
        this.startVideoCallEventSubscribers();
    }

    private registerMediaStatusPublisher() {
        this.userMediaService.isAudioOnly$.pipe(takeUntil(this.destroyedSubject)).subscribe(async audioOnly => {
            this.audioOnly = audioOnly;

            const mediaStatus = new ParticipantMediaStatus(false, audioOnly);
            await this.eventService.sendMediaStatus(this.conferenceId, this.vhParticipant.id, mediaStatus);
        });
    }

    private setTitle() {
        this.store.dispatch(ConferenceActions.enterWaitingRoomAsNonHost({ userRole: this.userRole }));
    }

    private cleanUp() {
        this.logger.debug(`${this.componentLoggerPrefix} clearing intervals and subscriptions`, {
            conference: this.vhConference?.id
        });

        this.executeWaitingRoomCleanup();

        this.destroyedSubject.next();
        this.destroyedSubject.complete();
        this.stopVideoCallEventSubscribers();
    }

    private startVideoCallEventSubscribers() {
        this.subscriptions.push(
            this.videoCallEventsService.onVideoWrapperReady().subscribe(() => this.setTrapFocus()),
            this.videoCallEventsService.onLeaveConsultation().subscribe(() => this.showLeaveConsultationModal()),
            this.videoCallEventsService.onLockConsultationToggled().subscribe(lock => this.setRoomLock(lock)),
            this.videoCallEventsService.onChangeDevice().subscribe(() => this.showChooseCameraDialog()),
            this.videoCallEventsService.onChangeLanguageSelected().subscribe(count => this.showLanguageChangeModal()),
            this.videoCallEventsService.onUnreadCountUpdated().subscribe(count => this.unreadMessageCounterUpdate(count))
        );
    }

    private stopVideoCallEventSubscribers() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    // copied from judge waiting room

    private onWowzaConnected() {
        if (this.audioRecordingService.restartActioned) {
            this.notificationToastrService.showAudioRecordingRestartSuccess(this.audioRestartCallback.bind(this));
        }
        this.continueWithNoRecording = false;
    }

    private onWowzaDisconnected() {
        if (
            this.vhConference.countdownComplete &&
            this.vhConference.audioRecordingRequired &&
            this.vhConference.status === ConferenceStatus.InSession &&
            !this.recordingPaused
        ) {
            if (this.audioRecordingService.restartActioned) {
                this.notificationToastrService.showAudioRecordingRestartFailure(this.audioRestartCallback.bind(this));
            } else {
                this.logWowzaAlert();
                this.showAudioRecordingRestartAlert();
            }
        }
    }

    private logWowzaAlert() {
        this.logger.warn(
            `${this.componentLoggerPrefix} not recording when expected, streaming agent could not establish connection: show alert`,
            {
                agent: this.audioRecordingService.wowzaAgent,
                showVideo: this.showVideo,
                continueWithNoRecording: this.continueWithNoRecording,
                audioErrorRetryToast: this.audioErrorRetryToast
            }
        );
    }

    private showAudioRecordingRestartAlert() {
        if (this.audioErrorRetryToast) {
            return;
        }
        this.audioErrorRetryToast = this.notificationToastrService.showAudioRecordingErrorWithRestart(this.reconnectWowzaAgent);
    }

    private reconnectWowzaAgent = (): void => {
        // Confirm in a hearing and not a consultation
        if (this.vhConference.status === ConferenceStatus.InSession && !this.isPrivateConsultation) {
            this.audioRecordingService.cleanupDialOutConnections();
            this.audioRecordingService.reconnectToWowza(() => {
                this.notificationToastrService.showAudioRecordingRestartFailure(this.audioRestartCallback.bind(this));
            });
        } else {
            this.logger.warn(`${this.componentLoggerPrefix} can not reconnect to Wowza agent as not in a hearing`);
        }
    };
}
