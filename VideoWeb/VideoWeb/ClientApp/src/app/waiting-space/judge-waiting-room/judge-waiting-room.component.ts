import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { merge, Subject, Subscription } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { AudioRecordingService } from 'src/app/services/api/audio-recording.service';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceStatus, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ClockService } from 'src/app/services/clock.service';
import { ConferenceService } from 'src/app/services/conference/conference.service';
import { ConferenceStatusChanged } from 'src/app/services/conference/models/conference-status-changed.model';
import { VirtualMeetingRoomModel } from 'src/app/services/conference/models/virtual-meeting-room.model';
import { ParticipantService } from 'src/app/services/conference/participant.service';
import { VideoControlCacheService } from 'src/app/services/conference/video-control-cache.service';
import { VideoControlService } from 'src/app/services/conference/video-control.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { UnloadDetectorService } from 'src/app/services/unload-detector.service';
import { HeartbeatModelMapper } from 'src/app/shared/mappers/heartbeat-model-mapper';
import { ParticipantModel } from 'src/app/shared/models/participant';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';
import { CallError } from '../models/video-call-models';
import { ConsultationInvitationService } from '../services/consultation-invitation.service';
import { NotificationSoundsService } from '../services/notification-sounds.service';
import { NotificationToastrService } from '../services/notification-toastr.service';
import { RoomClosingToastrService } from '../services/room-closing-toast.service';
import { VideoCallService } from '../services/video-call.service';
import { WaitingRoomBaseDirective } from '../waiting-room-shared/waiting-room-base.component';

@Component({
    selector: 'app-judge-waiting-room',
    templateUrl: './judge-waiting-room.component.html',
    styleUrls: ['./judge-waiting-room.component.scss', '../waiting-room-global-styles.scss']
})
export class JudgeWaitingRoomComponent extends WaitingRoomBaseDirective implements OnInit, OnDestroy {
    private readonly loggerPrefixJudge = '[Judge WR] -';
    private destroyedSubject = new Subject();

    audioRecordingInterval: NodeJS.Timer;
    isRecording: boolean;
    continueWithNoRecording = false;
    audioErrorToastOpen = false;
    audioRecordingStreamCheckIntervalSeconds = 10;
    conferenceRecordingInSessionForSeconds = 0;
    expanedPanel = true;
    displayConfirmStartHearingPopup: boolean;

    unreadMessageCount = 0;
    audioErrorToast: VhToastComponent;
    onParticipantOrVmrPexipConnectedOrIdUpdatedSubscription: Subscription;
    hearingCountdownFinishedSubscription: Subscription;
    conferenceStatusChangedSubscription: Subscription;
    participantStatusChangedSubscription: Subscription;
    onConferenceStatusChangedSubscription: Subscription;

    get isChatVisible() {
        return this.panelStates['Chat'];
    }

    constructor(
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
        private audioRecordingService: AudioRecordingService,
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
        private unloadDetectorService: UnloadDetectorService
    ) {
        super(
            route,
            videoWebService,
            eventService,
            logger,
            errorService,
            heartbeatMapper,
            videoCallService,
            deviceTypeService,
            router,
            consultationService,
            notificationSoundsService,
            notificationToastrService,
            roomClosingToastrService,
            clockService,
            consultationInvitiationService
        );
        this.displayConfirmStartHearingPopup = false;
        this.hearingStartingAnnounced = true; // no need to play announcements for a judge
    }

    ngOnInit() {
        this.init();
    }

    private init() {
        this.destroyedSubject = new Subject();

        this.errorCount = 0;
        this.logger.debug(`${this.loggerPrefixJudge} Loading judge waiting room`);
        this.loggedInUser = this.route.snapshot.data['loggedUser'];

        this.unloadDetectorService.shouldUnload.pipe(takeUntil(this.destroyedSubject)).subscribe(() => this.onShouldUnload());
        this.unloadDetectorService.shouldReload.pipe(take(1)).subscribe(() => this.onShouldReload());

        this.initialiseVideoControlCacheLogic();

        try {
            this.logger.debug(`${this.loggerPrefixJudge} Defined default devices in cache`);
            this.connected = false;
            this.getConference().then(() => {
                this.subscribeToClock();
                this.startEventHubSubscribers();
                this.connectToPexip();
                if (this.conference.audio_recording_required) {
                    this.initAudioRecordingInterval();
                }
            });
        } catch (error) {
            this.logger.error(`${this.loggerPrefixJudge} Failed to initialise the judge waiting room`, error);
            const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
            this.errorService.handlePexipError(new CallError(error.name), conferenceId);
        }
    }

    private onShouldReload(): void {
        window.location.reload();
    }

    private onShouldUnload(): void {
        this.cleanUp();
    }

    private initialiseVideoControlCacheLogic() {
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
            ).subscribe();
        });

        this.participantStatusChangedSubscription = this.participantService.onParticipantStatusChanged$.subscribe(participant =>
            this.updateSpotlightStateOnParticipantDisconnectDuringConference(participant)
        );

        this.onConferenceStatusChangedSubscription = this.conferenceService.onCurrentConferenceStatusChanged$.subscribe(update =>
            this.onConferenceInSessionCheckForDisconnectedParticipants(update)
        );
    }

    onConferenceStatusChanged(conferenceStatus: ConferenceStatusChanged): void {
        if (conferenceStatus.newStatus === ConferenceStatus.InSession) {
            this.logger.info(`${this.loggerPrefixJudge} spotlighting judge as it is the start of the hearing`);

            let participants = this.participantService.participants;

            if (conferenceStatus.oldStatus === ConferenceStatus.NotStarted) {
                this.videoControlService.setSpotlightStatus(
                    participants.find(p => p.role === Role.Judge),
                    true
                );

                participants = participants.filter(participant => participant.role !== Role.Judge);
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


    private restoreSpotlightIfParticipantIsNotInAVMR(participant: ParticipantModel) {
        if (!participant.virtualMeetingRoomSummary) {
            this.videoControlService.restoreParticipantsSpotlight(participant);
        }
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
            this.logger.info(`${this.loggerPrefixJudge} Participant disconnected while conference is in session`, {
                message: participant
            });

            let participantOrVmr: ParticipantModel | VirtualMeetingRoomModel = participant;
            if (participant.virtualMeetingRoomSummary) {
                const vmr = this.participantService.virtualMeetingRooms.find(
                    x => x.id === (participantOrVmr as ParticipantModel).virtualMeetingRoomSummary.id
                );

                this.logger.info(`${this.loggerPrefixJudge} Participant belongs to a VMR`, {
                    vmr: vmr
                });

                if (vmr.participants.some(x => x.status === ParticipantStatus.InHearing)) {
                    this.logger.info(
                        `${this.loggerPrefixJudge} Some participants are still in hearing. Not going to unspotlight the VMR.`,
                        {
                            vmr: vmr
                        }
                    );
                    return;
                }

                participantOrVmr = vmr;
            }

            this.logger.info(`${this.loggerPrefixJudge} Unspotlighting the participant or VMR.`, {
                participantOrVmr: participantOrVmr
            });

            this.videoControlCacheService.setSpotlightStatus(participantOrVmr.id, false);
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

    ngOnDestroy(): void {
        this.cleanUp();
    }

    private cleanUp() {
        this.logger.debug(`${this.loggerPrefixJudge} Clearing intervals and subscriptions for JOH waiting room`, {
            conference: this.conference?.id
        });

        clearInterval(this.audioRecordingInterval);
        this.cleanupVideoControlCacheLogic();
        this.executeWaitingRoomCleanup();

        this.destroyedSubject.next();
        this.destroyedSubject.complete();
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
        }
    }

    async startHearing() {
        const action = this.isNotStarted() ? 'start' : 'resume';
        try {
            this.logger.debug(`${this.loggerPrefixJudge} Judge clicked ${action} hearing`, {
                conference: this.conferenceId,
                status: this.conference.status
            });

            await this.videoCallService.startHearing(this.hearing.id, this.videoCallService.getPreferredLayout(this.conferenceId));
        } catch (err) {
            this.logger.error(`${this.loggerPrefixJudge} Failed to ${action} a hearing for conference`, err, {
                conference: this.conferenceId,
                status: this.conference.status
            });
            this.errorService.handleApiError(err);
        }
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

    initAudioRecordingInterval() {
        this.audioRecordingInterval = setInterval(async () => {
            await this.retrieveAudioStreamInfo(this.conference.hearing_ref_id);
        }, this.audioRecordingStreamCheckIntervalSeconds * 1000);
    }

    private showAudioRecordingAlert() {
        if (this.audioErrorToastOpen) {
            return;
        }
        this.audioErrorToastOpen = true;
        this.audioErrorToast = this.notificationToastrService.showAudioRecordingError(this.continueWithNoRecordingCallback.bind(this));
    }

    continueWithNoRecordingCallback() {
        if (this.audioErrorToast.actioned) {
            this.continueWithNoRecording = true;
        }
        this.audioErrorToastOpen = false;
        this.audioErrorToast = null;
    }

    async retrieveAudioStreamInfo(hearingId): Promise<void> {
        if (this.conference.status === ConferenceStatus.InSession) {
            this.conferenceRecordingInSessionForSeconds += this.audioRecordingStreamCheckIntervalSeconds;
        } else {
            this.conferenceRecordingInSessionForSeconds = 0;
            this.continueWithNoRecording = false;
        }

        if (this.conferenceRecordingInSessionForSeconds > 60 && !this.continueWithNoRecording) {
            this.logger.debug(`${this.loggerPrefixJudge} Attempting to retrieve audio stream info for ${hearingId}`);
            try {
                const audioStreamWorking = await this.audioRecordingService.getAudioStreamInfo(hearingId);
                this.logger.debug(`${this.loggerPrefixJudge} Got response: recording: ${audioStreamWorking}`);
                if (!audioStreamWorking && !this.continueWithNoRecording && this.showVideo) {
                    this.logger.debug(`${this.loggerPrefixJudge} not recording when expected, show alert`);
                    this.showAudioRecordingAlert();
                }
            } catch (error) {
                this.logger.error(`${this.loggerPrefixJudge} Failed to get audio stream info`, error, { conference: this.conferenceId });

                if (!this.continueWithNoRecording) {
                    this.logger.info(`${this.loggerPrefixJudge} Should not continue without a recording. Show alert.`, {
                        conference: this.conferenceId
                    });
                    this.showAudioRecordingAlert();
                }
            }
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

    leaveConsultation() {
        if (this.isPrivateConsultation) {
            this.showLeaveConsultationModal();
        } else {
            this.leaveJudicialConsultation();
        }
    }
}
