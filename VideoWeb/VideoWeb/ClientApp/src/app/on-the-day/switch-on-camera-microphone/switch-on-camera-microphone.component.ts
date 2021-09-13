import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { AddMediaEventRequest, ConferenceResponse, Role } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { vhContactDetails } from 'src/app/shared/contact-information';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ParticipantStatusBaseDirective } from 'src/app/on-the-day/models/participant-status-base';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { first, timeout } from 'rxjs/operators';

@Component({
    selector: 'app-switch-on-camera-microphone',
    templateUrl: './switch-on-camera-microphone.component.html'
})
export class SwitchOnCameraMicrophoneComponent extends ParticipantStatusBaseDirective implements OnInit {
    mediaAccepted: boolean;
    userPrompted: boolean;
    isJudge: boolean;
    loadingData: boolean;
    conference: ConferenceResponse;
    participantName: string;
    conferenceId: string;

    contact = {
        phone: vhContactDetails.phone
    };

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        private videoWebService: VideoWebService,
        private profileService: ProfileService,
        private errorService: ErrorService,
        protected logger: Logger,
        protected participantStatusUpdateService: ParticipantStatusUpdateService,
        private userMediaStreamService: UserMediaStreamService
    ) {
        super(participantStatusUpdateService, logger);
        this.userPrompted = false;
        this.mediaAccepted = false;
        this.isJudge = false;
    }

    ngOnInit() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.retrieveProfile().then(() => {
            if (this.conferenceId) {
                this.getConference();
            }
        });
    }

    async retrieveProfile(): Promise<void> {
        this.logger.debug('[SwitchOnCameraMicrophone] - Retrieving profile');
        const profile = await this.profileService.getUserProfile();
        this.isJudge = profile.role === Role.Judge;
        this.participantName = this.videoWebService.getObfuscatedName(profile.first_name + ' ' + profile.last_name);
    }

    async getConference(): Promise<void> {
        this.logger.debug('[SwitchOnCameraMicrophone] - Retrieving conference', { conference: this.conferenceId });
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        try {
            this.conference = await this.videoWebService.getConferenceById(this.conferenceId);
        } catch (error) {
            this.logger.error('[SwitchOnCameraMicrophone] - Failed to retrieve conference', error, { conference: this.conferenceId });
            this.errorService.handleApiError(error);
        }
    }

    async requestMedia() {
        this.userMediaStreamService.currentStream$
            .pipe(first())
            .pipe(timeout(1000))
            .subscribe({
                next: stream => {
                    this.mediaAccepted = true;
                    this.userPrompted = true;
                },
                error: error => {
                    this.mediaAccepted = false;
                    this.userPrompted = false;
                    this.logger.warn(`[SwitchOnCameraMicrophone] - ${this.participantName} denied access to camera.`, {
                        conference: this.conferenceId,
                        participant: this.participantName,
                        error: error
                    });
                    this.postPermissionDeniedAlert();
                    this.errorService.goToServiceError(
                        'error-camera-microphone.problem-with-camera-mic',
                        'error-camera-microphone.camera-mic-in-use',
                        false
                    );
                }
            });
    }

    goVideoTest() {
        if (this.isJudge && this.conferenceId) {
            this.logger.debug('[SwitchOnCameraMicrophone] - Navigating to judge self test video');
            this.router.navigate([pageUrls.JudgeSelfTestVideo, this.conferenceId]);
        } else if (!this.isJudge && this.conferenceId) {
            this.logger.debug('[SwitchOnCameraMicrophone] - Navigating to participant self test video');
            this.router.navigate([pageUrls.ParticipantSelfTestVideo, this.conferenceId]);
        } else {
            this.logger.debug('[SwitchOnCameraMicrophone] - Navigating to independent self test video');
            this.router.navigate([pageUrls.IndependentSelfTestVideo]);
        }
    }

    async postPermissionDeniedAlert() {
        const payload = {
            conference: this.conferenceId,
            participant: this.participantName
        };
        this.logger.debug('[SwitchOnCameraMicrophone] - Raising media permission denied alert', payload);
        try {
            await this.videoWebService.raiseMediaEvent(this.conference.id, new AddMediaEventRequest());
        } catch (error) {
            this.logger.error('[SwitchOnCameraMicrophone] - Failed to post media permission denied alert', error, payload);
        }
    }
}
