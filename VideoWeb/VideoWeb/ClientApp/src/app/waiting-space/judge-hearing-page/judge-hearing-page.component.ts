import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ConferenceResponse, ConferenceStatus, UserRole } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { UserMediaService } from 'src/app/services/user-media.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { Subscription } from 'rxjs';

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

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private videoWebService: VideoWebService,
        private eventService: EventsService,
        private ngZone: NgZone,
        public sanitizer: DomSanitizer,
        private errorService: ErrorService,
        private userMediaService: UserMediaService,
        private logger: Logger
    ) {
        this.loadingData = true;
    }

    ngOnInit() {
        this.getConference()
            .then(conference => {
                this.loadingData = false;
                this.conference = conference;
                this.sanitiseIframeUrl();
                this.setupSubscribers();
            })
            .catch(error => {
                this.loadingData = false;
                if (!this.errorService.returnHomeIfUnauthorised(error)) {
                    this.errorService.handleApiError(error);
                }
            });
    }

    ngOnDestroy(): void {
        this.eventHubSubscriptions.unsubscribe();
        this.selectedHearingUrl = '';
    }

    async getConference(): Promise<ConferenceResponse> {
        this.logger.debug('getting conf for judge hearing');
        const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.logger.debug(`getting conf ${conferenceId}`);
        return this.videoWebService.getConferenceById(conferenceId).toPromise();
    }

    async sanitiseIframeUrl(): Promise<void> {
        const judge = this.conference.participants.find(x => x.role === UserRole.Judge);
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
                this.ngZone.run(() => {
                    this.handleHearingStatusChange(<ConferenceStatus>message.status);
                });
            })
        );

        this.logger.debug('Subscribing to EventHub disconnects');
        this.eventHubSubscriptions.add(
            this.eventService.getServiceDisconnected().subscribe(() => {
                this.ngZone.run(() => {
                    this.logger.info(`EventHub disconnection for vh officer`);
                    this.refreshConferenceDataDuringDisconnect();
                });
            })
        );

        this.logger.debug('Subscribing to EventHub reconnects');
        this.eventHubSubscriptions.add(
            this.eventService.getServiceReconnected().subscribe(() => {
                this.ngZone.run(() => {
                    this.logger.info(`EventHub reconnected for vh officer`);
                    this.refreshConferenceDataDuringDisconnect();
                });
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
        const judge = this.conference.participants.find(x => x.role === UserRole.Judge);
        const properties = {
            conferenceId: this.conference.id,
            user: judge.id
        };

        if (conferenceStatus === ConferenceStatus.Closed) {
            this.logger.event(`Conference closed, navigating back to hearing list`, properties);
            return this.router.navigate([PageUrls.JudgeHearingList]);
        }

        if (conferenceStatus === ConferenceStatus.Paused || conferenceStatus === ConferenceStatus.Suspended) {
            this.logger.event(`Conference closed, navigating back to waiting room`, properties);
            return this.router.navigate([PageUrls.JudgeWaitingRoom, this.conference.id]);
        }
    }

    judgeURLChanged() {
        this.logger.debug('judge url changed');
        const iFrameElem = <HTMLIFrameElement>document.getElementById('judgeIframe');
        console.log(iFrameElem);
        const src = iFrameElem.src;
        console.log(src);
        if (src && src !== this.judgeUri) {
            this.logger.warn(`Uri ${src} is not recogised`);
            this.router.navigate([PageUrls.JudgeHearingList]);
        }
    }
}
