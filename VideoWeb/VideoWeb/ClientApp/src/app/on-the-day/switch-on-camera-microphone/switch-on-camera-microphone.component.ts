import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { AddMediaEventRequest, ConferenceResponse, Role } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { vhContactDetails } from 'src/app/shared/contact-information';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ParticipantStatusBase } from 'src/app/on-the-day/models/participant-status-base';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';

@Component({
    selector: 'app-switch-on-camera-microphone',
    templateUrl: './switch-on-camera-microphone.component.html'
})
export class SwitchOnCameraMicrophoneComponent extends ParticipantStatusBase implements OnInit {
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
        private userMediaStreamService: UserMediaStreamService,
        private profileService: ProfileService,
        private errorService: ErrorService,
        protected logger: Logger,
        protected participantStatusUpdateService: ParticipantStatusUpdateService
    ) {
        super(participantStatusUpdateService, logger, route);
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
        const profile = await this.profileService.getUserProfile();
        this.isJudge = profile.role === Role.Judge;
        this.participantName = this.videoWebService.getObfuscatedName(profile.first_name + ' ' + profile.last_name);
    }

    async getConference(): Promise<void> {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        try {
            this.conference = await this.videoWebService.getConferenceById(this.conferenceId);
        } catch (error) {
            this.errorService.handleApiError(error);
        }
    }

    async requestMedia() {
        this.mediaAccepted = await this.userMediaStreamService.requestAccess();
        this.userPrompted = true;
        if (!this.mediaAccepted) {
            this.logger.info(
                `Switch on Camera-Microphone | ConferenceId : ${this.conferenceId}, CaseName : ${this.conference.case_name} | Participant : ${this.participantName} denied access to camera.`
            );
            this.postPermissionDeniedAlert();
        }
    }

    goVideoTest() {
        if (this.isJudge && this.conferenceId) {
            this.router.navigate([pageUrls.JudgeSelfTestVideo, this.conferenceId]);
        } else if (!this.isJudge && this.conferenceId) {
            this.router.navigate([pageUrls.ParticipantSelfTestVideo, this.conferenceId]);
        } else {
            this.router.navigate([pageUrls.IndependentSelfTestVideo]);
        }
    }

    async postPermissionDeniedAlert() {
        try {
            await this.videoWebService.raiseMediaEvent(this.conference.id, new AddMediaEventRequest());
        } catch (error) {
            this.logger.error('Failed to post media permission denied alert', error);
        }
    }
}
