import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AudioRecordingService } from 'src/app/services/api/audio-recording.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse, ConferenceStatus, Role } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaService } from 'src/app/services/user-media.service';
import { pageUrls } from 'src/app/shared/page-url.constants';

@Component({
    selector: 'app-judge-hearing-page',
    templateUrl: './judge-hearing-page.component.html',
    styleUrls: ['./judge-hearing-page.component.css']
})
export class JudgeHearingPageComponent implements OnInit, OnDestroy {
    loadingData: boolean;
    conference: ConferenceResponse;
    selectedHearingUrl: SafeResourceUrl;
    allowPermissions: string;
    judgeUri: string;

    eventHubSubscriptions: Subscription = new Subscription();

    interval: NodeJS.Timer;
    isRecording: boolean;
    continueWithNoRecording = false;
    showAudioRecordingAlert = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private videoWebService: VideoWebService,
        private eventService: EventsService,
        public sanitizer: DomSanitizer,
        private errorService: ErrorService,
        private userMediaService: UserMediaService,
        private logger: Logger,
        private audioRecordingService: AudioRecordingService
    ) {
        this.loadingData = true;
    }

    async ngOnInit() {
        this.getConference()
            .then(conference => {
                this.conference = conference;
                this.sanitiseIframeUrl();
                this.loadingData = false;
                this.setupSubscribers();
                if (this.conference.audio_recording_required) {
                    setTimeout(() => this.setupAudioRecordingInterval(), 60000);
                }
            })
            .catch(error => {
                this.loadingData = false;
                this.errorService.handleApiError(error);
            });
    }

    ngOnDestroy(): void {
        this.eventHubSubscriptions.unsubscribe();
        this.selectedHearingUrl = '';
        clearInterval(this.interval);
    }

    async getConference(): Promise<ConferenceResponse> {
        this.logger.debug('getting conf for judge hearing');
        const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.logger.debug(`getting conf ${conferenceId}`);
        return this.videoWebService.getConferenceById(conferenceId);
    }

    async sanitiseIframeUrl(): Promise<void> {
        const judge = this.conference.participants.find(x => x.role === Role.Judge);
        const encodedDisplayName = encodeURIComponent(judge.tiled_display_name);

        const preferredCam = await this.userMediaService.getPreferredCamera();
        const preferredMic = await this.userMediaService.getPreferredMicrophone();

        let cam = '';
        let mic = preferredMic ? preferredMic.deviceId : '';

        if (preferredCam) {
            this.logger.info(`judge using camera ${preferredCam.label}`);
            cam = encodeURI(preferredCam.label);
        }

        if (preferredMic) {
            this.logger.info(`judge using microphone ${preferredMic.label}`);
            mic = encodeURI(preferredMic.label);
        }

        const iframeOrigin = new URL(this.conference.judge_i_frame_uri).origin;
        this.allowPermissions = `microphone ${iframeOrigin}; camera ${iframeOrigin};`;

        this.judgeUri = `${this.conference.judge_i_frame_uri}?display_name=${encodedDisplayName}&cam=${cam}&mic=${mic}`;
        this.selectedHearingUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.judgeUri);
    }

    private setupSubscribers() {
        this.eventHubSubscriptions.add(
            this.eventService.getHearingStatusMessage().subscribe(message => {
                this.handleHearingStatusChange(<ConferenceStatus>message.status);
            })
        );

        this.logger.debug('Subscribing to EventHub disconnects');
        this.eventHubSubscriptions.add(
            this.eventService.getServiceDisconnected().subscribe(() => {
                this.logger.info(`EventHub disconnection for vh officer`);
                this.refreshConferenceDataDuringDisconnect();
            })
        );

        this.logger.debug('Subscribing to EventHub reconnects');
        this.eventHubSubscriptions.add(
            this.eventService.getServiceReconnected().subscribe(() => {
                this.logger.info(`EventHub reconnected for vh officer`);
                this.refreshConferenceDataDuringDisconnect();
            })
        );

        this.eventService.start();
    }

    async refreshConferenceDataDuringDisconnect() {
        this.conference = await this.getConference();
        this.determineJudgeLocation();
    }

    handleHearingStatusChange(status: ConferenceStatus) {
        this.conference.status = status;
        this.determineJudgeLocation();
    }

    determineJudgeLocation() {
        const conferenceStatus = this.conference.status;
        const judge = this.conference.participants.find(x => x.role === Role.Judge);
        const properties = {
            conferenceId: this.conference.id,
            user: judge.id
        };

        if (conferenceStatus === ConferenceStatus.Closed) {
            this.stopAudioRecording();
            this.logger.event(`Conference closed, navigating back to hearing list`, properties);
            return this.router.navigate([pageUrls.JudgeHearingList]);
        }

        if (conferenceStatus === ConferenceStatus.Paused || conferenceStatus === ConferenceStatus.Suspended) {
            this.logger.event(`Conference closed, navigating back to waiting room`, properties);
            return this.router.navigate([pageUrls.JudgeWaitingRoom, this.conference.id]);
        }
    }

    judgeURLChanged() {
        this.logger.debug('judge url changed');
        const iFrameElem = <HTMLIFrameElement>document.getElementById('judgeIframe');
        this.logger.debug(JSON.stringify(iFrameElem));
        const src = iFrameElem.src;
        this.logger.debug(src);
        if (src && src !== this.judgeUri) {
            this.logger.warn(`Uri ${src} is not recogised`);
            this.router.navigate([pageUrls.JudgeHearingList]);
        }
    }

    setupAudioRecordingInterval() {
        this.interval = setInterval(async () => {
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
        clearInterval(this.interval);
    }

    async stopAudioRecording() {
        if (this.conference.audio_recording_required) {
            this.logger.event(`[Judge WR] - stop audio recording for hearing ${this.conference.hearing_ref_id}`);

            try {
                await this.audioRecordingService.stopAudioRecording(this.conference.hearing_ref_id);
            } catch (error) {
                this.logger.error(`[Judge WR] - failed to stop audio recording for hearing ${this.conference.hearing_ref_id}`, error);
            }
        }
    }
}
