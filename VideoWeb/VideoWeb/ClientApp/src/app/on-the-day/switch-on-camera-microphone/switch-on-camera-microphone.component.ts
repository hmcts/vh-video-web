import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { AddMediaEventRequest, ConferenceResponse, UserRole } from 'src/app/services/clients/api-client';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import 'webrtc-adapter';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VhContactDetails } from 'src/app/shared/contact-information';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';

@Component({
    selector: 'app-switch-on-camera-microphone',
    templateUrl: './switch-on-camera-microphone.component.html'
})
export class SwitchOnCameraMicrophoneComponent implements OnInit {
    mediaAccepted: boolean;
    userPrompted: boolean;
    isJudge: boolean;
    conferenceId: string;
    loadingData: boolean;
    conference: ConferenceResponse;
    participantName: string;

    contact = {
        phone: VhContactDetails.phone
    };

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private videoWebService: VideoWebService,
        private adalService: AdalService,
        private userMediaStreamService: UserMediaStreamService,
        private profileService: ProfileService,
        private errorService: ErrorService,
        private logger: Logger
    ) {
        this.userPrompted = false;
        this.mediaAccepted = false;
        this.isJudge = false;
    }

    async ngOnInit() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.retrieveProfile();
        if (this.conferenceId) {
            this.getConference();
        }
    }

    async retrieveProfile(): Promise<void> {
        const profile = await this.profileService.getUserProfile();
        this.isJudge = profile.role === UserRole.Judge;
        this.participantName = this.videoWebService.getObfuscatedName(profile.first_name + ' ' + profile.last_name);
    }

    getConference(): void {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.videoWebService.getConferenceById(this.conferenceId).subscribe(
            conference => (this.conference = conference),
            error => {
                if (!this.errorService.returnHomeIfUnauthorised(error)) {
                    this.errorService.handleApiError(error);
                }
            }
        );
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
        if (this.isJudge) {
            if (this.conferenceId) {
                this.router.navigate([PageUrls.JudgeSelfTestVideo, this.conferenceId]);
            } else {
                this.router.navigate([PageUrls.IndependentSelfTestVideo]);
            }
        } else {
            if (this.conferenceId) {
                this.router.navigate([PageUrls.ParticipantSelfTestVideo, this.conferenceId]);
            } else {
                this.router.navigate([PageUrls.IndependentSelfTestVideo]);
            }
        }
    }

    postPermissionDeniedAlert() {
        const participant = this.conference.participants.find(
            x => x.username.toLocaleLowerCase() === this.adalService.userInfo.userName.toLocaleLowerCase()
        );
        this.videoWebService
            .raiseMediaEvent(this.conference.id, new AddMediaEventRequest({ participant_id: participant.id.toString() }))
            .subscribe(
                () => {},
                error => {
                    this.logger.error('Failed to post media permission denied alert', error);
                }
            );
    }
}
