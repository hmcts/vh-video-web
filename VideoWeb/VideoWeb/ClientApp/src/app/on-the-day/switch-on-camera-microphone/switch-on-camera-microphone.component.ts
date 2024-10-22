import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { AddMediaEventRequest, ConferenceResponse, Role, UserProfileResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { vhContactDetails } from 'src/app/shared/contact-information';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ParticipantStatusBaseDirective } from 'src/app/on-the-day/models/participant-status-base';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
import { UserMediaStreamServiceV2 } from 'src/app/services/user-media-stream-v2.service';

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

    skipSelfTest = false;

    contact = {
        phone: vhContactDetails.englandAndWales.phoneNumber
    };
    profile: UserProfileResponse;

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        private videoWebService: VideoWebService,
        private profileService: ProfileService,
        private errorService: ErrorService,
        protected logger: Logger,
        protected participantStatusUpdateService: ParticipantStatusUpdateService,
        private userMediaService: UserMediaService,
        private userMediaStreamService: UserMediaStreamServiceV2
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
        this.profile = await this.profileService.getUserProfile();
        this.isJudge = this.profile.roles.includes(Role.Judge);
        this.participantName = this.videoWebService.getObfuscatedName(this.profile.first_name + ' ' + this.profile.last_name);
    }

    async getConference(): Promise<void> {
        this.logger.debug('[SwitchOnCameraMicrophone] - Retrieving conference', { conference: this.conferenceId });
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        try {
            this.conference = await this.videoWebService.getConferenceById(this.conferenceId);
            this.skipSelfTest = this.isObserver();
        } catch (error) {
            this.logger.error('[SwitchOnCameraMicrophone] - Failed to retrieve conference', error, { conference: this.conferenceId });
            this.errorService.handleApiError(error);
        }
    }

    async requestMedia() {
        this.userMediaService.initialise();
        this.userMediaStreamService.currentStream$.pipe().subscribe({
            next: stream => {
                if (!stream || !stream.active) {
                    return;
                }
                this.mediaAccepted = true;
                this.userPrompted = true;
                this.userMediaStreamService.closeCurrentStream();
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
        this.userMediaStreamService.createAndPublishStream();
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

    goToDeclaration() {
        this.logger.debug('[SwitchOnCameraMicrophone] - Navigating to declaration page');
        this.router.navigate([pageUrls.Declaration, this.conferenceId]);
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

    private isObserver() {
        if (this.profile.roles.includes(Role.QuickLinkObserver)) {
            return true;
        }
        return this.conference.participants.some(x => x.user_name === this.profile.username && x.hearing_role === HearingRole.OBSERVER);
    }
}
