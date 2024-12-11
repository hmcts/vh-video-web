import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { merge, Subscription } from 'rxjs';
import { take, takeUntil, tap } from 'rxjs/operators';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceStatus, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { ConferenceService } from 'src/app/services/conference/conference.service';
import { ConferenceStatusChanged } from 'src/app/services/conference/models/conference-status-changed.model';
import { PexipDisplayNameModel } from 'src/app/services/conference/models/pexip-display-name.model';
import { VirtualMeetingRoomModel } from 'src/app/services/conference/models/virtual-meeting-room.model';
import { ParticipantService } from 'src/app/services/conference/participant.service';
import { VideoControlCacheService } from 'src/app/services/conference/video-control-cache.service';
import { VideoControlService } from 'src/app/services/conference/video-control.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { HearingLayoutService } from 'src/app/services/hearing-layout.service';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { UnloadDetectorService } from 'src/app/services/unload-detector.service';
import { ParticipantModel } from 'src/app/shared/models/participant';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';
import { CallError, ParticipantUpdated } from '../models/video-call-models';
import { ConsultationInvitationService } from '../services/consultation-invitation.service';
import { NotificationSoundsService } from '../services/notification-sounds.service';
import { NotificationToastrService } from '../services/notification-toastr.service';
import { ParticipantRemoteMuteStoreService } from '../services/participant-remote-mute-store.service';
import { RoomClosingToastrService } from '../services/room-closing-toast.service';
import { VideoCallService } from '../services/video-call.service';
import { WaitingRoomBaseDirective } from '../waiting-room-shared/waiting-room-base.component';
import { Title } from '@angular/platform-browser';
import { ModalTrapFocus } from '../../shared/modal/modal-trap-focus';
import { HideComponentsService } from '../services/hide-components.service';
import { FocusService } from 'src/app/services/focus.service';
import { ConferenceStatusMessage } from '../../services/models/conference-status-message';
import { Store } from '@ngrx/store';
import { ConferenceState } from '../store/reducers/conference.reducer';
import { LaunchDarklyService } from '../../services/launch-darkly.service';
import { AudioRecordingService } from '../../services/audio-recording.service';
import { getCountdownComplete } from '../store/selectors/conference.selectors';

@Component({
    selector: 'app-judge-waiting-room',
    templateUrl: './judge-waiting-room.component.html',
    styleUrls: ['./judge-waiting-room.component.scss', '../waiting-room-global-styles.scss']
})
export class JudgeWaitingRoomComponent extends WaitingRoomBaseDirective implements OnDestroy, OnInit {
    continueWithNoRecording = false;
    expanedPanel = true;
    hostWantsToJoinHearing = false;
    displayConfirmStartHearingPopup: boolean;
    displayJoinHearingPopup: boolean;

    unreadMessageCount = 0;
    audioErrorRetryToast: VhToastComponent;
    onParticipantOrVmrPexipConnectedOrIdUpdatedSubscription: Subscription;
    hearingCountdownFinishedSubscription: Subscription;
    conferenceStatusChangedSubscription: Subscription;
    participantStatusChangedSubscription: Subscription;
    onConferenceStatusChangedSubscription: Subscription;
    participants: ParticipantUpdated[] = [];

    private readonly loggerPrefixJudge = '[Judge WR] -';
    private recordingPaused: boolean;

    constructor(
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
        protected translateService: TranslateService,
        protected consultationInvitiationService: ConsultationInvitationService,
        protected conferenceService: ConferenceService,
        protected participantService: ParticipantService,
        protected videoControlService: VideoControlService,
        protected videoControlCacheService: VideoControlCacheService,
        private readonly unloadDetectorService: UnloadDetectorService,
        private readonly hearingLayoutService: HearingLayoutService,
        protected participantRemoteMuteStoreService: ParticipantRemoteMuteStoreService,
        protected hearingVenueFlagsService: HearingVenueFlagsService,
        protected titleService: Title,
        protected hideComponentsService: HideComponentsService,
        protected focusService: FocusService,
        protected launchDarklyService: LaunchDarklyService,
        protected store: Store<ConferenceState>,
        private readonly audioRecordingService: AudioRecordingService
    ) {
        super(
            route,
            videoWebService,
            eventService,
            logger,
            errorService,
            videoCallService,
            deviceTypeService,
            router,
            consultationService,
            notificationSoundsService,
            notificationToastrService,
            roomClosingToastrService,
            clockService,
            consultationInvitiationService,
            participantRemoteMuteStoreService,
            hearingVenueFlagsService,
            titleService,
            hideComponentsService,
            focusService,
            launchDarklyService,
            store
        );
        this.displayConfirmStartHearingPopup = false;
        this.hearingStartingAnnounced = true; // no need to play announcements for a judge
    }

    get isChatVisible() {
        return this.panelStates['Chat'];
    }

    get canShowHearingLayoutSelection() {
        return !this.hearing.isClosed() && !this.hearing.isInSession();
    }

    videoClosedExt() {
        this.audioErrorRetryToast = null;
    }

    ngOnInit() {
        this.init();
        this.divTrapId = 'video-container';
    }

    assignPexipIdToRemoteStore(participant: ParticipantUpdated): void {
        const participantDisplayName = PexipDisplayNameModel.fromString(participant.pexipDisplayName);
        if (participant.uuid && participantDisplayName !== null) {
            this.participantRemoteMuteStoreService.assignPexipId(participantDisplayName.participantOrVmrId, participant.uuid);
        }
        this.logger.debug(`${this.loggerPrefixJudge} stored pexip ID updated`, {
            pexipId: participant.uuid,
            participantId: participantDisplayName?.participantOrVmrId
        });
    }

    isStaffMember(): boolean {
        return this.loggedInUser.role === Role.StaffMember;
    }

    onConferenceStatusChanged(conferenceStatus: ConferenceStatusChanged): void {
        if (conferenceStatus.newStatus === ConferenceStatus.InSession) {
            this.logger.debug(`${this.loggerPrefixJudge} spotlighting judge as it is the start of the hearing`);

            const participants = this.participantService.participants;

            if (conferenceStatus.oldStatus === ConferenceStatus.NotStarted) {
                this.videoControlCacheService.setSpotlightStatus(participants.find(p => p.role === Role.Judge).id, true);
            }

            participants.forEach(participant => {
                this.restoreSpotlightIfParticipantIsNotInAVMR(participant);
            });

            this.participantService.virtualMeetingRooms.forEach(vmr => {
                this.videoControlService.restoreParticipantsSpotlight(vmr);
            });
        }
    }

    restoreSpotlightState(): void {
        this.participantService.participants.forEach(participant => {
            this.restoreSpotlightIfParticipantIsNotInAVMR(participant);
        });

        this.participantService.virtualMeetingRooms.forEach(vmr => {
            this.videoControlService.restoreParticipantsSpotlight(vmr);
        });
    }

    onConferenceInSessionCheckForDisconnectedParticipants(update: { oldStatus: ConferenceStatus; newStatus: ConferenceStatus }): void {
        if (update.newStatus === ConferenceStatus.InSession) {
            this.participantService.participants
                .filter(x => !x.virtualMeetingRoomSummary)
                .forEach(participant => {
                    if (participant.status === ParticipantStatus.Disconnected) {
                        this.videoControlCacheService.setSpotlightStatus(participant.id, false);
                    }
                });

            this.participantService.virtualMeetingRooms.forEach(vmr => {
                if (vmr.participants.every(x => x.status === ParticipantStatus.Disconnected)) {
                    this.videoControlCacheService.setSpotlightStatus(vmr.id, false);
                }
            });
        }
    }

    updateSpotlightStateOnParticipantDisconnectDuringConference(participant: ParticipantModel) {
        if (
            participant.status === ParticipantStatus.Disconnected &&
            this.conferenceService.currentConference.status === ConferenceStatus.InSession
        ) {
            this.logger.debug(`${this.loggerPrefixJudge} Participant disconnected while conference is in session`, {
                message: participant
            });

            let participantOrVmr: ParticipantModel | VirtualMeetingRoomModel = participant;
            if (participant.virtualMeetingRoomSummary) {
                const vmr = this.participantService.virtualMeetingRooms.find(
                    x => x.id === (participantOrVmr as ParticipantModel).virtualMeetingRoomSummary.id
                );

                this.logger.debug(`${this.loggerPrefixJudge} Participant belongs to a VMR`, {
                    vmr: vmr
                });

                if (vmr.participants.some(x => x.status === ParticipantStatus.InHearing)) {
                    this.logger.debug(
                        `${this.loggerPrefixJudge} Some participants are still in hearing. Not going to unspotlight the VMR.`,
                        {
                            vmr: vmr
                        }
                    );
                    return;
                }

                participantOrVmr = vmr;
            }

            this.logger.debug(`${this.loggerPrefixJudge} Unspotlighting the participant or VMR.`, {
                participantOrVmr: participantOrVmr
            });

            this.videoControlCacheService.setSpotlightStatus(participantOrVmr.id, false);
        }
    }

    ngOnDestroy(): void {
        this.cleanUp();
    }

    getConferenceStatusText() {
        switch (this.conference.status) {
            case ConferenceStatus.NotStarted:
                return this.translateService.instant('judge-waiting-room.start-this-hearing');
            case ConferenceStatus.Suspended:
                return this.translateService.instant('judge-waiting-room.hearing-suspended');
            case ConferenceStatus.Paused:
                return this.translateService.instant('judge-waiting-room.hearing-paused');
            case ConferenceStatus.Closed:
                return this.translateService.instant('judge-waiting-room.hearing-is-closed');
            default:
                return this.translateService.instant('judge-waiting-room.hearing-is-in-session');
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
            status: this.conference.status
        });
        this.focusService.storeFocus();
        this.displayConfirmStartHearingPopup = true;
    }

    onStartConfirmAnswered(actionConfirmed: boolean) {
        this.logger.debug(`${this.loggerPrefixJudge} Judge responded to start hearing confirmation`, {
            conference: this.conferenceId,
            status: this.conference.status,
            confirmStart: actionConfirmed
        });
        this.displayConfirmStartHearingPopup = false;
        if (actionConfirmed) {
            this.startHearing();
        } else {
            this.focusService.restoreFocus();
        }
    }

    async onJoinConfirmAnswered(actionConfirmed: boolean) {
        this.logger.debug(`${this.loggerPrefixJudge} Judge responded to join hearing confirmation`, {
            conference: this.conferenceId,
            status: this.conference.status,
            confirmStart: actionConfirmed
        });
        this.displayJoinHearingPopup = false;
        if (actionConfirmed) {
            await this.joinHearingInSession();
        }
    }

    async joinHearingClicked() {
        this.displayJoinPopup();
    }

    displayJoinPopup() {
        this.displayJoinHearingPopup = true;
    }

    async startHearing() {
        const action = this.isNotStarted() ? 'start' : 'resume';
        this.audioRecordingService.restartActioned = false;
        this.logger.debug(`${this.loggerPrefixJudge} Judge clicked ${action} hearing`, {
            conference: this.conferenceId,
            status: this.conference.status
        });

        this.hearingLayoutService.currentLayout$.pipe(take(1)).subscribe(async layout => {
            try {
                this.hostWantsToJoinHearing = true;
                await this.videoCallService.startHearing(this.hearing.id, layout);
            } catch (err) {
                this.logger.error(`${this.loggerPrefixJudge} Failed to ${action} a hearing for conference`, err, {
                    conference: this.conferenceId,
                    status: this.conference.status
                });
                this.errorService.handleApiError(err);
            }
        });
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
        return this.conference.status === ConferenceStatus.Suspended;
    }

    hearingPaused(): boolean {
        return this.conference.status === ConferenceStatus.Paused;
    }

    isHearingInSession(): boolean {
        return this.conference.status === ConferenceStatus.InSession;
    }

    async joinHearingInSession() {
        this.hostWantsToJoinHearing = true;
        await this.videoCallService.joinHearingInSession(this.conferenceId, this.participant.id);
    }

    shouldCurrentUserJoinHearing(): boolean {
        return this.participant.status === ParticipantStatus.InHearing;
    }

    resetVideoFlags() {
        super.resetVideoFlags();
        this.hostWantsToJoinHearing = false;
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
            this.conference.audio_recording_required &&
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
        if (this.participant.status === ParticipantStatus.InConsultation) {
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

    leaveHearing() {
        this.hostWantsToJoinHearing = false;
    }

    setTrapFocus() {
        ModalTrapFocus.trap('video-container');
    }

    handleHearingStatusMessage(message: ConferenceStatusMessage) {
        if (message.conferenceId === this.conference.id) {
            this.logger.debug(`${this.loggerPrefixJudge} Hearing status message received`, {
                message: message
            });
            if (message.status === ConferenceStatus.Paused || this.conference.status === ConferenceStatus.Suspended) {
                this.audioRecordingService.cleanupDialOutConnections();
            }
        }
    }

    syncDisplayName(pexipParticipant: ParticipantUpdated) {
        const pexipDisplayModel = PexipDisplayNameModel.fromString(pexipParticipant.pexipDisplayName);
        if (
            pexipParticipant.pexipDisplayName.includes(this.participant.id) &&
            this.participant.display_name !== pexipDisplayModel.displayName
        ) {
            this.videoCallService.setParticipantOverlayText(pexipParticipant.uuid, this.participant.display_name);
        }
    }

    init() {
        this.errorCount = 0;
        this.logger.debug(`${this.loggerPrefixJudge} Loading judge waiting room`);
        this.loggedInUser = this.route.snapshot.data['loggedUser'];

        this.unloadDetectorService.shouldUnload.pipe(takeUntil(this.onDestroy$)).subscribe(() => this.onShouldUnload());
        this.unloadDetectorService.shouldReload.pipe(take(1)).subscribe(() => this.onShouldReload());

        this.initConferenceStatusLogic();

        this.videoCallService
            .onParticipantCreated()
            .pipe(
                takeUntil(this.onDestroy$),
                tap(createdParticipant => {
                    this.logger.debug(`${this.loggerPrefixJudge} participant created`, {
                        pexipId: createdParticipant.uuid,
                        displayName: createdParticipant.pexipDisplayName
                    });
                })
            )
            .subscribe(createdParticipant => {
                this.assignPexipIdToRemoteStore(createdParticipant);
            });

        this.videoCallService
            .onParticipantUpdated()
            .pipe(
                takeUntil(this.onDestroy$),
                tap(updatedParticipant => {
                    this.logger.debug(`${this.loggerPrefixJudge} participant updated`, {
                        pexipId: updatedParticipant.uuid,
                        dispayName: updatedParticipant.pexipDisplayName
                    });
                })
            )
            .subscribe(updatedParticipant => {
                this.assignPexipIdToRemoteStore(updatedParticipant);
                this.syncDisplayName(updatedParticipant);
            });

        this.videoCallService
            .onConferenceAdjourned()
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(() => this.audioRecordingService.cleanupDialOutConnections());

        this.eventService
            .getParticipantMediaStatusMessage()
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(participantStatusMessage => {
                if (participantStatusMessage.conferenceId === this.conference.id) {
                    this.participantRemoteMuteStoreService.updateLocalMuteStatus(
                        participantStatusMessage.participantId,
                        participantStatusMessage.mediaStatus.is_local_audio_muted,
                        participantStatusMessage.mediaStatus.is_local_video_muted
                    );
                }
            });

        try {
            this.logger.debug(`${this.loggerPrefixJudge} Defined default devices in cache`);
            this.connected = false;
            this.getConference().then(() => {
                this.subscribeToClock();
                this.startEventHubSubscribers();
                this.connectToPexip();
            });
        } catch (error) {
            this.logger.error(`${this.loggerPrefixJudge} Failed to initialise the judge waiting room`, error);
            const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
            this.errorService.handlePexipError(new CallError(error.name), conferenceId);
        }

        this.eventService
            .getAudioRestartActioned()
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((conferenceId: string) => {
                if (conferenceId === this.conference.id && this.audioErrorRetryToast) {
                    this.logger.warn(`${this.loggerPrefixJudge} Audio restart actioned by another host`);
                    this.audioErrorRetryToast.vhToastOptions.concludeToast(this.audioRestartCallback.bind(this));
                }
            });

        this.eventService
            .getHearingStatusMessage()
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((message: ConferenceStatusMessage) => this.handleHearingStatusMessage(message));

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
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(complete => {
                if (complete) {
                    this.logger.debug(`${this.loggerPrefixJudge} Hearing countdown complete`);
                    this.verifyAudioRecordingStream();
                }
            });
    }

    private onShouldReload(): void {
        window.location.reload();
    }

    private onShouldUnload(): void {
        this.cleanUp();
    }

    private initConferenceStatusLogic() {
        this.hearingCountdownFinishedSubscription = this.eventService.getHearingCountdownCompleteMessage().subscribe(() => {
            this.conferenceStatusChangedSubscription?.unsubscribe();
            this.conferenceStatusChangedSubscription = this.conferenceService.onCurrentConferenceStatusChanged$.subscribe(
                conferenceStatus => this.onConferenceStatusChanged(conferenceStatus)
            );
            this.onParticipantOrVmrPexipConnectedOrIdUpdatedSubscription?.unsubscribe();
            this.onParticipantOrVmrPexipConnectedOrIdUpdatedSubscription = merge<ParticipantModel | VirtualMeetingRoomModel>(
                this.participantService.onParticipantConnectedToPexip$,
                this.participantService.onParticipantPexipIdChanged$,
                this.participantService.onVmrConnectedToPexip$,
                this.participantService.onVmrPexipIdChanged$
            ).subscribe(() => this.restoreSpotlightState());
        });

        this.participantStatusChangedSubscription = this.participantService.onParticipantStatusChanged$.subscribe(participant =>
            this.updateSpotlightStateOnParticipantDisconnectDuringConference(participant)
        );

        this.onConferenceStatusChangedSubscription = this.conferenceService.onCurrentConferenceStatusChanged$.subscribe(update =>
            this.onConferenceInSessionCheckForDisconnectedParticipants(update)
        );
    }

    private restoreSpotlightIfParticipantIsNotInAVMR(participant: ParticipantModel) {
        if (!participant.virtualMeetingRoomSummary) {
            this.videoControlService.restoreParticipantsSpotlight(participant);
        }
    }

    private cleanupVideoControlCacheLogic() {
        this.hearingCountdownFinishedSubscription?.unsubscribe();
        this.hearingCountdownFinishedSubscription = null;

        this.conferenceStatusChangedSubscription?.unsubscribe();
        this.conferenceStatusChangedSubscription = null;

        this.onParticipantOrVmrPexipConnectedOrIdUpdatedSubscription?.unsubscribe();
        this.onParticipantOrVmrPexipConnectedOrIdUpdatedSubscription = null;

        this.participantStatusChangedSubscription?.unsubscribe();
        this.participantStatusChangedSubscription = null;

        this.onConferenceStatusChangedSubscription?.unsubscribe();
        this.onConferenceStatusChangedSubscription = null;
    }

    private cleanUp() {
        this.cleanupVideoControlCacheLogic();
        this.executeWaitingRoomCleanup();
        this.audioRecordingService.cleanupSubscriptions();
    }

    private onWowzaConnected() {
        if (this.audioRecordingService.restartActioned) {
            this.notificationToastrService.showAudioRecordingRestartSuccess(this.audioRestartCallback.bind(this));
        }
        this.continueWithNoRecording = false;
    }

    private onWowzaDisconnected() {
        if (this.conference.audio_recording_required && this.conference.status === ConferenceStatus.InSession && !this.recordingPaused) {
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

    private reconnectWowzaAgent(): void {
        this.audioRecordingService.cleanupDialOutConnections();
        this.audioRecordingService.reconnectToWowza.bind(this, () => {
            this.notificationToastrService.showAudioRecordingRestartFailure(this.audioRestartCallback.bind(this));
        });
    }
}
