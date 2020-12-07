import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { AudioRecordingService } from 'src/app/services/api/audio-recording.service';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { HeartbeatModelMapper } from 'src/app/shared/mappers/heartbeat-model-mapper';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { CallError } from '../models/video-call-models';
import { NotificationSoundsService } from '../services/notification-sounds.service';
import { VideoCallService } from '../services/video-call.service';
import { WaitingRoomBaseComponent } from '../waiting-room-shared/waiting-room-base.component';

@Component({
    selector: 'app-judge-waiting-room',
    templateUrl: './judge-waiting-room.component.html',
    styleUrls: ['./judge-waiting-room.component.scss', '../waiting-room-global-styles.scss']
})
export class JudgeWaitingRoomComponent extends WaitingRoomBaseComponent implements OnInit, OnDestroy {
    private readonly loggerPrefixJudge = '[Judge WR] -';
    audioRecordingInterval: NodeJS.Timer;
    isRecording: boolean;
    continueWithNoRecording = false;
    showAudioRecordingAlert = false;
    expanedPanel = true;
    displayConfirmStartHearingPopup: boolean;

    constructor(
        protected route: ActivatedRoute,
        protected videoWebService: VideoWebService,
        protected eventService: EventsService,
        protected adalService: AdalService,
        protected logger: Logger,
        protected errorService: ErrorService,
        protected heartbeatMapper: HeartbeatModelMapper,
        protected videoCallService: VideoCallService,
        protected deviceTypeService: DeviceTypeService,
        protected router: Router,
        protected consultationService: ConsultationService,
        private audioRecordingService: AudioRecordingService,
        protected userMediaService: UserMediaService,
        protected userMediaStreamService: UserMediaStreamService,
        protected notificationSoundsService: NotificationSoundsService
    ) {
        super(
            route,
            videoWebService,
            eventService,
            adalService,
            logger,
            errorService,
            heartbeatMapper,
            videoCallService,
            deviceTypeService,
            router,
            consultationService,
            userMediaService,
            userMediaStreamService,
            notificationSoundsService
        );
        this.displayConfirmStartHearingPopup = false;
    }

    ngOnInit() {
        this.errorCount = 0;
        this.logger.debug(`${this.loggerPrefixJudge} Loading judge waiting room`);
        this.userMediaService
            .setDefaultDevicesInCache()
            .then(() => {
                this.logger.debug(`${this.loggerPrefixJudge} Defined default devices in cache`);
                this.connected = false;
                this.getConference().then(() => {
                    this.startEventHubSubscribers();
                    this.getJwtokenAndConnectToPexip();
                });
            })
            .catch((error: Error | MediaStreamError) => {
                this.logger.error(`${this.loggerPrefixJudge} Failed to initialise the judge waiting room`, error);
                const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
                this.errorService.handlePexipError(new CallError(error.name), conferenceId);
            });
    }

    @HostListener('window:beforeunload')
    async ngOnDestroy(): Promise<void> {
        this.logger.debug(`${this.loggerPrefixJudge} Clearing intervals and subscriptions for judge waiting room`, {
            conference: this.conferenceId
        });
        this.executeEndHearingSequence();
        this.eventHubSubscription$.unsubscribe();
        this.videoCallSubscription$.unsubscribe();
    }

    executeEndHearingSequence() {
        this.stopHeartbeat();
        clearTimeout(this.callbackTimeout);
        clearInterval(this.audioRecordingInterval);
        this.disconnect();
    }

    getConferenceStatusText() {
        switch (this.conference.status) {
            case ConferenceStatus.NotStarted:
                return 'Start this hearing';
            case ConferenceStatus.Suspended:
                return 'Hearing suspended';
            case ConferenceStatus.Paused:
                return 'Hearing paused';
            case ConferenceStatus.Closed:
                return 'Hearing is closed';
            default:
                return 'Hearing is in session';
        }
    }

    isNotStarted(): boolean {
        return this.conference.status === ConferenceStatus.NotStarted;
    }

    isPaused(): boolean {
        return this.conference.status === ConferenceStatus.Paused || this.conference.status === ConferenceStatus.Suspended;
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

    handleConferenceStatusChange(message: ConferenceStatusMessage) {
        super.handleConferenceStatusChange(message);
        if (this.validateIsForConference(message.conferenceId) && message.status === ConferenceStatus.Closed) {
            this.executeEndHearingSequence();
            this.router.navigate([pageUrls.JudgeHearingList]);
        }
    }

    initAudioRecordingInterval() {
        this.audioRecordingInterval = setInterval(async () => {
            await this.retrieveAudioStreamInfo(this.conference.hearing_ref_id);
        }, 10000);
    }

    async retrieveAudioStreamInfo(hearingId): Promise<void> {
        this.logger.debug(`${this.loggerPrefixJudge} Attempting to retrieve audio stream info for ${hearingId}`);
        try {
            const audioStreamWorking = await this.audioRecordingService.getAudioStreamInfo(hearingId);
            this.logger.debug(`${this.loggerPrefixJudge} Got response: recording: ${audioStreamWorking}`);

            if (!audioStreamWorking && !this.continueWithNoRecording) {
                this.logger.debug(`${this.loggerPrefixJudge} not recording when expected, show alert`);
                this.showAudioRecordingAlert = true;
            }
        } catch (error) {
            this.logger.error(`${this.loggerPrefixJudge} Failed to get audio stream info`, error, { conference: this.conferenceId });

            if (!this.continueWithNoRecording) {
                this.logger.info(`${this.loggerPrefixJudge} Should not continue without a recording. Show alert.`, {
                    conference: this.conferenceId
                });
                this.showAudioRecordingAlert = true;
            }
        }
    }

    closeAlert(value) {
        this.logger.debug(`${this.loggerPrefixJudge} Closing alert`);
        this.showAudioRecordingAlert = !value;
        this.continueWithNoRecording = true;
        clearInterval(this.audioRecordingInterval);
    }

    isIMEnabled(): boolean {
        if (!this.hearing) {
            return false;
        }
        if (this.deviceTypeService.isIpad()) {
            return !this.hearing.isInSession() && this.showVideo;
        }
        return true;
    }
}
