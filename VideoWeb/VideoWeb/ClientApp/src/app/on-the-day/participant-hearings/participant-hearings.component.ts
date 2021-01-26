import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceForIndividualResponse, CurrentUserOrParticipantResponse, Role } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
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
    loggedInParticipant: CurrentUserOrParticipantResponse;

    constructor(
        private videoWebService: VideoWebService,
        private errorService: ErrorService,
        private router: Router,
        private logger: Logger
    ) {
        this.loadingData = true;
    }

    ngOnInit() {
        this.errorCount = 0;
        this.retrieveHearingsForUser();
        this.interval = setInterval(() => {
            this.retrieveHearingsForUser();
        }, 30000);
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        this.logger.debug('[ParticipantHearings] - Clearing intervals and subscriptions for individual');
        clearInterval(this.interval);
        this.conferencesSubscription.unsubscribe();
    }

    retrieveHearingsForUser() {
        this.logger.debug('[ParticipantHearings] - Updating hearing list');
        this.conferencesSubscription = this.videoWebService.getConferencesForIndividual().subscribe(
            (data: ConferenceForIndividualResponse[]) => {
                this.logger.debug('[ParticipantHearings] - Got updated list');
                this.errorCount = 0;
                this.loadingData = false;
                this.conferences = data;
            },
            error => {
                this.logger.warn('[ParticipantHearings] - Error retrieving conferences for individual', error);
                this.handleApiError(error);
            }
        );
    }

    handleApiError(error) {
        this.errorCount++;
        this.loadingData = false;
        if (this.errorCount > 3) {
            this.logger.warn('[ParticipantHearings] - Failed to get hearings more than 3 times', error);
            this.errorService.handleApiError(error);
        } else {
            this.errorService.handleApiError(error, true);
        }
    }

    hasHearings() {
        return this.conferences !== undefined && this.conferences.length > 0;
    }

    goToEquipmentCheck() {
        this.logger.debug('[ParticipantHearings] - Going to equipment check page');
        this.router.navigate([pageUrls.EquipmentCheck]);
    }

    async onConferenceSelected(conference: ConferenceForIndividualResponse) {
        this.logger.debug('[ParticipantHearings] - Loading conference details', { conference: conference.id });
        this.videoWebService.setActiveIndividualConference(conference);
        try {
            if (!this.loggedInParticipant) {
                this.loggedInParticipant = await this.videoWebService.getCurrentParticipant(conference.id);
            }
            const conferenceResponse = await this.videoWebService.getConferenceById(conference.id);

            const participant = conferenceResponse.participants.find(p => p.id === this.loggedInParticipant.participant_id);
            if (participant.role === Role.JudicialOfficeHolder) {
                this.logger.debug('[ParticipantHearings] - User is a Judicial Office Holder. Skipping to waiting room', {
                    conference: conference.id,
                    participant: participant.id
                });
                this.router.navigate([pageUrls.JOHWaitingRoom, conference.id]);
            } else {
                this.logger.debug('[ParticipantHearings] - Going to introduction page', {
                    conference: conference.id,
                    participant: participant.id
                });
                this.router.navigate([pageUrls.Introduction, conference.id]);
            }
        } catch (error) {
            this.logger.warn('[ParticipantHearings] - Error retrieving conferences details', { conference: conference.id });
            this.errorService.handleApiError(error);
        }
    }
}
