import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter, take, takeUntil } from 'rxjs/operators';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { ConferenceStatus, ParticipantStatus } from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { UnloadDetectorService } from 'src/app/services/unload-detector.service';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';
import { CallError, ParticipantUpdated } from '../models/video-call-models';
import { ConsultationInvitationService } from '../services/consultation-invitation.service';
import { NotificationToastrService } from '../services/notification-toastr.service';
import { RoomClosingToastrService } from '../services/room-closing-toast.service';
import { VideoCallService } from '../services/video-call.service';
import { WaitingRoomBaseDirective } from '../waiting-room-shared/waiting-room-base.component';
import { ModalTrapFocus } from '../../shared/modal/modal-trap-focus';
import { HideComponentsService } from '../services/hide-components.service';
import { FocusService } from 'src/app/services/focus.service';
import { Store } from '@ngrx/store';
import { ConferenceState } from '../store/reducers/conference.reducer';
import { LaunchDarklyService } from '../../services/launch-darkly.service';
import { AudioRecordingService } from '../../services/audio-recording.service';
import { getCountdownComplete } from '../store/selectors/conference.selectors';
import { VideoCallHostActions } from '../store/actions/video-call-host.actions';
import { Subscription } from 'rxjs';
import { VideoCallEventsService } from '../services/video-call-events.service';

@Component({
    standalone: false,
    selector: 'app-judge-waiting-room',
    templateUrl: './judge-waiting-room.component.html',
    styleUrls: ['./judge-waiting-room.component.scss', '../waiting-room-global-styles.scss']
})
export class JudgeWaitingRoomComponent extends WaitingRoomBaseDirective implements OnDestroy, OnInit {
    continueWithNoRecording = false;
    recordingPaused: boolean;
    expanedPanel = true;
    displayConfirmStartHearingPopup: boolean;
    displayJoinHearingPopup: boolean;

    unreadMessageCount = 0;
    audioErrorRetryToast: VhToastComponent;

    participants: ParticipantUpdated[] = [];
    subscrptions: Subscription[] = [];

    private readonly loggerPrefixJudge = '[Judge WR] -';

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
        private readonly unloadDetectorService: UnloadDetectorService,
        protected hideComponentsService: HideComponentsService,
        protected focusService: FocusService,
        protected launchDarklyService: LaunchDarklyService,
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
            launchDarklyService,
            store,
            videoCallEventsService
        );
        this.displayConfirmStartHearingPopup = false;
    }

    get canShowHearingLayoutSelection() {
        return !this.hearing.isClosed() && !this.hearing.isInSession();
    }

    videoClosedExt() {
        this.audioErrorRetryToast?.remove();
        this.audioErrorRetryToast = null;
    }

    ngOnInit() {
        if (this.vhConference && this.vhParticipant) {
            this.init();
        }
        this.divTrapId = 'video-container';
    }

    ngOnDestroy(): void {
        this.cleanUp();
    }

    getConferenceStatusText() {
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

    isNotStarted(): boolean {
        return this.hearing.isNotStarted();
    }

    isPaused(): boolean {
        return this.hearing.isPaused() || this.hearing.isSuspended();
    }

    displayConfirmStartPopup() {
        this.logger.debug(`${this.loggerPrefixJudge} Display start hearing confirmation popup`, {
            conference: this.conferenceId,
            status: this.vhConference.status
        });
        this.focusService.storeFocus();
        this.displayConfirmStartHearingPopup = true;
    }

    onStartConfirmAnswered(actionConfirmed: boolean) {
        this.logger.debug(`${this.loggerPrefixJudge} Judge responded to start hearing confirmation`, {
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

    onJoinConfirmAnswered(actionConfirmed: boolean) {
        this.logger.debug(`${this.loggerPrefixJudge} Judge responded to join hearing confirmation`, {
            conference: this.conferenceId,
            status: this.vhConference.status,
            confirmStart: actionConfirmed
        });
        this.displayJoinHearingPopup = false;
        if (actionConfirmed) {
            this.joinHearingInSession();
        }
    }

    joinHearingClicked() {
        this.displayJoinPopup();
    }

    displayJoinPopup() {
        this.displayJoinHearingPopup = true;
    }

    startHearing() {
        this.audioRecordingService.restartActioned = false;
        this.logger.debug(`${this.loggerPrefixJudge} Judge clicked start/resume hearing`, {
            conference: this.conferenceId,
            status: this.vhConference.status
        });

        this.store.dispatch(VideoCallHostActions.startHearing({ conferenceId: this.conferenceId }));
    }

    goToJudgeHearingList(): void {
        this.logger.debug(`${this.loggerPrefixJudge} Judge is leaving conference and returning to hearing list`, {
            conference: this.conferenceId
        });
        this.router.navigate([pageUrls.JudgeHearingList]);
    }

    checkEquipment() {
        this.logger.debug(`${this.loggerPrefixJudge} Judge is leaving conference and checking equipment`, {
            conference: this.conferenceId
        });
        this.router.navigate([pageUrls.EquipmentCheck, this.conferenceId]);
    }

    hearingSuspended(): boolean {
        return this.vhConference.status === ConferenceStatus.Suspended;
    }

    hearingPaused(): boolean {
        return this.vhConference.status === ConferenceStatus.Paused;
    }

    isHearingInSession(): boolean {
        return this.vhConference.status === ConferenceStatus.InSession;
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

    unreadMessageCounterUpdate(count: number) {
        this.unreadMessageCount = count;
    }

    async leaveConsultation() {
        if (this.isPrivateConsultation) {
            this.showLeaveConsultationModal();
        } else {
            await this.leaveJudicialConsultation();
        }
    }

    setTrapFocus() {
        ModalTrapFocus.trap('video-container');
    }

    init() {
        this.errorCount = 0;
        this.logger.debug(`${this.loggerPrefixJudge} Loading judge waiting room`);
        this.loggedInUser = this.route.snapshot.data['loggedUser'];

        this.unloadDetectorService.shouldUnload.pipe(takeUntil(this.onDestroy$)).subscribe(() => this.onShouldUnload());
        this.unloadDetectorService.shouldReload.pipe(take(1)).subscribe(() => this.onShouldReload());

        try {
            this.logger.debug(`${this.loggerPrefixJudge} Defined default devices in cache`);
            this.connected = false;
            this.getConference();
            this.subscribeToClock();
            this.startEventHubSubscribers();
            this.connectToPexip();
        } catch (error) {
            this.logger.error(`${this.loggerPrefixJudge} Failed to initialise the judge waiting room`, error);
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
                    this.logger.warn(`${this.loggerPrefixJudge} Audio restart actioned by another host`);
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
                    this.logger.debug(`${this.loggerPrefixJudge} Hearing countdown complete`);
                    this.verifyAudioRecordingStream();
                }
            });

        this.startVideoCallEventSubscribers();
    }

    private onShouldReload(): void {
        window.location.reload();
    }

    private onShouldUnload(): void {
        this.cleanUp();
    }

    private cleanUp() {
        this.executeWaitingRoomCleanup();
        this.audioRecordingService.cleanupSubscriptions();
        this.stopVideoCallEventSubscribers();
    }

    private onWowzaConnected() {
        if (this.audioRecordingService.restartActioned) {
            this.notificationToastrService.showAudioRecordingRestartSuccess(this.audioRestartCallback.bind(this));
        }
        this.continueWithNoRecording = false;
    }

    private onWowzaDisconnected() {
        if (this.vhConference.audioRecordingRequired && this.vhConference.status === ConferenceStatus.InSession && !this.recordingPaused) {
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
            `${this.loggerPrefixJudge} not recording when expected, streaming agent could not establish connection: show alert`,
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
            this.logger.warn(`${this.loggerPrefixJudge} can not reconnect to Wowza agent as not in a hearing`);
        }
    };

    private startVideoCallEventSubscribers() {
        this.subscriptions.push(
            this.videoCallEventsService.onVideoWrapperReady().subscribe(() => this.setTrapFocus()),
            this.videoCallEventsService.onLeaveConsultation().subscribe(() => this.showLeaveConsultationModal()),
            this.videoCallEventsService.onChangeDevice().subscribe(() => this.showChooseCameraDialog()),
            this.videoCallEventsService.onUnreadCountUpdated().subscribe(count => this.unreadMessageCounterUpdate(count))
        );
    }

    private stopVideoCallEventSubscribers() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }
}
