import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceForIndividualResponse, LoggedParticipantResponse } from 'src/app/services/clients/api-client';
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
    loggedInParticipant: LoggedParticipantResponse;

    constructor(
        private videoWebService: VideoWebService,
        private errorService: ErrorService,
        private router: Router,
        private logger: Logger,
        private translate: TranslateService
    ) {
        this.loadingData = true;
    }

    getTranslation(key: string) {
        return this.translate.instant(`participant-hearings.${key}`);
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
        this.conferencesSubscription = this.videoWebService.getConferencesForIndividual().subscribe({
            next: (data: ConferenceForIndividualResponse[]) => {
                this.logger.debug('[ParticipantHearings] - Got updated list');
                this.errorCount = 0;
                this.loadingData = false;
                this.conferences = data;
            },
            error:(error) => {
                this.logger.warn('[ParticipantHearings] - Error retrieving conferences for individual', error);
                this.handleApiError(error);
            }
        });
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

            this.logger.debug('[ParticipantHearings] - Going to introduction page', {
                conference: conference.id,
                participant: participant.id
            });
            this.router.navigate([pageUrls.Introduction, conference.id]);
        } catch (error) {
            this.logger.warn('[ParticipantHearings] - Error retrieving conferences details', { conference: conference.id });
            this.errorService.handleApiError(error);
        }
    }
}
