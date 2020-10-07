import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceForIndividualResponse, UserProfileResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
import { ProfileService } from '../../services/api/profile.service';
import { pageUrls } from '../../shared/page-url.constants';

@Component({
    selector: 'app-participant-hearings',
    templateUrl: './participant-hearings.component.html'
})
export class ParticipantHearingsComponent implements OnInit, OnDestroy {
    conferences: ConferenceForIndividualResponse[];
    conferencesSubscription: Subscription;
    loadingData: boolean;
    interval: any;
    errorCount: number;
    profile: UserProfileResponse;

    constructor(
        private videoWebService: VideoWebService,
        private errorService: ErrorService,
        private router: Router,
        private profileService: ProfileService,
        private logger: Logger
    ) {
        this.loadingData = true;
    }

    ngOnInit() {
        this.profileService.getUserProfile().then(profile => {
            this.profile = profile;
        });
        this.errorCount = 0;
        this.retrieveHearingsForUser();
        this.interval = setInterval(() => {
            this.retrieveHearingsForUser();
        }, 30000);
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        this.logger.debug('Clearing intervals and subscriptions for individual');
        clearInterval(this.interval);
        this.conferencesSubscription.unsubscribe();
    }

    retrieveHearingsForUser() {
        this.conferencesSubscription = this.videoWebService.getConferencesForIndividual().subscribe(
            (data: ConferenceForIndividualResponse[]) => {
                this.errorCount = 0;
                this.loadingData = false;
                this.conferences = data;
            },
            error => {
                this.logger.error('Error retrieving conferences for individual', error);
                this.handleApiError(error);
            }
        );
    }

    handleApiError(error) {
        this.errorCount++;
        this.loadingData = false;
        if (this.errorCount > 3) {
            this.errorService.handleApiError(error);
        } else {
            this.errorService.handleApiError(error, true);
        }
    }

    hasHearings() {
        return this.conferences !== undefined && this.conferences.length > 0;
    }

    goToEquipmentCheck() {
        this.router.navigate([pageUrls.EquipmentCheck]);
    }

    onConferenceSelected(conference: ConferenceForIndividualResponse) {
        this.videoWebService.setActiveIndividualConference(conference);

        this.videoWebService
            .getConferenceById(conference.id)
            .then(data => {
                const conferenceResponse = data;
                const participant = conferenceResponse.participants.find(
                    p => p.username.toLowerCase() === this.profile.username.toLowerCase()
                );
                if (
                    participant.hearing_role.toLowerCase() === HearingRole.PANEL_MEMBER.toLocaleLowerCase() ||
                    participant.hearing_role.toLowerCase() === HearingRole.WINGER.toLocaleLowerCase()
                ) {
                    this.router.navigate([pageUrls.ParticipantWaitingRoom, conference.id]);
                } else {
                    this.router.navigate([pageUrls.Introduction, conference.id]);
                }
            })
            .catch(error => {
                this.errorService.handleApiError(error);
            });
    }
}
