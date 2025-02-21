import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceForIndividualResponse, LoggedParticipantResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from '../../shared/page-url.constants';
import { EventsService } from 'src/app/services/events.service';

@Component({
    standalone: false,
    selector: 'app-participant-hearings',
    templateUrl: './participant-hearings.component.html'
})
export class ParticipantHearingsComponent implements OnInit, OnDestroy {
    conferences: ConferenceForIndividualResponse[];
    conferencesSubscription: Subscription;
    loadingData: boolean;
    errorCount: number;
    loggedInParticipant: LoggedParticipantResponse;
    eventHubSubscriptions: Subscription = new Subscription();

    constructor(
        private videoWebService: VideoWebService,
        private errorService: ErrorService,
        private router: Router,
        private logger: Logger,
        private translate: TranslateService,
        private hearingVenueFlagsService: HearingVenueFlagsService,
        private eventsService: EventsService
    ) {
        this.loadingData = true;
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        this.logger.debug('[ParticipantHearings] - Clearing subscriptions for individual');
        this.conferencesSubscription.unsubscribe();
        this.eventHubSubscriptions.unsubscribe();
    }

    getTranslation(key: string) {
        return this.translate.instant(`participant-hearings.${key}`);
    }

    ngOnInit() {
        this.errorCount = 0;
        this.retrieveHearingsForUser();
        this.setUpEventHubSubscribers();
    }

    setUpEventHubSubscribers() {
        this.eventHubSubscriptions.add(this.eventsService.getNewConferenceAdded().subscribe(() => this.retrieveHearingsForUser()));
        this.eventHubSubscriptions.add(this.eventsService.getHearingCancelled().subscribe(() => this.retrieveHearingsForUser()));
        this.eventHubSubscriptions.add(this.eventsService.getHearingDetailsUpdated().subscribe(() => this.retrieveHearingsForUser()));
        this.eventHubSubscriptions.add(this.eventsService.getParticipantsUpdated().subscribe(() => this.retrieveHearingsForUser()));
        this.eventHubSubscriptions.add(this.eventsService.getEndpointsUpdated().subscribe(() => this.retrieveHearingsForUser()));
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
            error: error => {
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
        this.hearingVenueFlagsService.setHearingVenueIsScottish(conference.hearing_venue_is_scottish);
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
