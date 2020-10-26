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
import { HeartbeatModelMapper } from 'src/app/shared/mappers/heartbeat-model-mapper';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { VideoCallService } from '../services/video-call.service';
import { WaitingRoomBaseComponent } from '../waiting-room-shared/waiting-room-base.component';
import { UserMediaService } from 'src/app/services/user-media.service';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';

@Component({
    selector: 'app-judge-waiting-room',
    templateUrl: './judge-waiting-room.component.html',
    styleUrls: ['./judge-waiting-room.component.scss', '../waiting-room-global-styles.scss']
})
export class JudgeWaitingRoomComponent extends WaitingRoomBaseComponent implements OnInit, OnDestroy {
    audioRecordingInterval: NodeJS.Timer;
    isRecording: boolean;
    continueWithNoRecording = false;
    showAudioRecordingAlert = false;
    expanedPanel = true;

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
        protected userMediaStreamService: UserMediaStreamService
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
            userMediaStreamService
        );
    }

    async ngOnInit() {
        this.errorCount = 0;
        this.logger.debug('Loading judge waiting room');

        await this.userMediaService.setDefaultDevicesInCache();

        this.showChooseDeviceDialog();
        this.connected = false;
        this.getConference().then(() => {
            this.startEventHubSubscribers();
            if (this.getShowDialogChooseDevice()) {
                this.getJwtokenAndConnectToPexip();
            }
        });
    }

    showChooseDeviceDialog() {
        this.displayDeviceChangeModal = !this.getShowDialogChooseDevice();
    }

    @HostListener('window:beforeunload')
    async ngOnDestroy(): Promise<void> {
        this.logger.debug('[Judge WR] - Clearing intervals and subscriptions for judge waiting room');
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

    async startHearing() {
        try {
            await this.videoCallService.startHearing(this.hearing.id, this.videoCallService.getPreferredLayout(this.conference.id));
        } catch (err) {
            this.errorService.handleApiError(err);
        }
    }

    goToJudgeHearingList(): void {
        this.router.navigate([pageUrls.JudgeHearingList]);
    }

    checkEquipment() {
        this.router.navigate([pageUrls.EquipmentCheck, this.conference.id]);
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
        this.logger.debug(`**** retrieve audio stream info for ${hearingId}`);
        try {
            const audioStreamWorking = await this.audioRecordingService.getAudioStreamInfo(hearingId);
            this.logger.debug('**** Got response: recording: ' + audioStreamWorking);

            if (!audioStreamWorking && !this.continueWithNoRecording) {
                this.logger.debug('**** not recording, show alert');
                this.showAudioRecordingAlert = true;
            }
        } catch (error) {
            this.logger.debug('**** Got error: ' + JSON.stringify(error));

            if (!this.continueWithNoRecording) {
                this.logger.debug('**** showAudioRecordingAlert FROM catch');
                this.showAudioRecordingAlert = true;
            }
        }
    }

    closeAlert(value) {
        this.showAudioRecordingAlert = !value;
        this.continueWithNoRecording = true;
        clearInterval(this.audioRecordingInterval);
    }
}
