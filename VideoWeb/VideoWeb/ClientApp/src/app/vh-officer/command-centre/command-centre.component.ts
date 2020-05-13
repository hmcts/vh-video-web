import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ScreenHelper } from 'src/app/shared/screen-helper';
import { ConferenceForVhOfficerResponse, HearingVenueResponse } from 'src/app/services/clients/api-client';
import { SessionStorage } from 'src/app/services/session-storage';
import { Subscription } from 'rxjs';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { Hearing } from 'src/app/shared/models/hearing';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { VhoStorageKeys } from '../services/models/session-keys';
import { MenuOption } from '../models/menus-options';
import { EventsService } from 'src/app/services/events.service';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { ConferenceHelper } from 'src/app/shared/conference-helper';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';

@Component({
    selector: 'app-command-centre',
    templateUrl: './command-centre.component.html',
    styleUrls: ['./command-centre.component.scss', '../vho-global-styles.scss']
})
export class CommandCentreComponent implements OnInit, OnDestroy {
    public menuOption = MenuOption;

    private readonly venueAllocationStorage: SessionStorage<HearingVenueResponse[]>;

    venueAllocations: string[] = [];

    selectedMenu: MenuOption;

    conferencesSubscription: Subscription;
    eventHubSubscriptions: Subscription = new Subscription();

    conferences: HearingSummary[];
    selectedHearing: Hearing;

    interval: NodeJS.Timer;
    loadingData: boolean;

    constructor(
        private videoWebService: VideoWebService,
        private errorService: ErrorService,
        private eventService: EventsService,
        private logger: Logger,
        private router: Router,
        private screenHelper: ScreenHelper
    ) {
        this.loadingData = false;
        this.venueAllocationStorage = new SessionStorage<HearingVenueResponse[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
    }

    ngOnInit(): void {
        this.selectedMenu = this.menuOption.Hearing;
        this.screenHelper.enableFullScreen(true);
        this.setupEventHubSubscribers();
        this.getConferenceForSelectedAllocations();
    }

    ngOnDestroy(): void {
        this.screenHelper.enableFullScreen(false);
        clearInterval(this.interval);
        if (this.conferencesSubscription) {
            this.conferencesSubscription.unsubscribe();
        }
        this.eventHubSubscriptions.unsubscribe();
    }

    setupEventHubSubscribers() {
        this.logger.debug('Subscribing to conference status changes...');
        this.eventHubSubscriptions.add(
            this.eventService.getHearingStatusMessage().subscribe(message => {
                this.handleConferenceStatusChange(message);
            })
        );

        this.logger.debug('Subscribing to participant status changes...');
        this.eventHubSubscriptions.add(
            this.eventService.getParticipantStatusMessage().subscribe(message => {
                this.handleParticipantStatusChange(message);
            })
        );

        this.logger.debug('Subscribing to EventHub disconnects');
        this.eventHubSubscriptions.add(
            this.eventService.getServiceDisconnected().subscribe(async reconnectionAttempt => {
                if (reconnectionAttempt <= 6) {
                    this.logger.info(`EventHub disconnection for vh officer`);
                    await this.refreshConferenceDataDuringDisconnect();
                } else {
                    this.errorService.goToServiceError('Your connection was lost');
                }
            })
        );

        this.logger.debug('Subscribing to EventHub reconnects');
        this.eventHubSubscriptions.add(
            this.eventService.getServiceReconnected().subscribe(async () => {
                this.logger.info(`EventHub reconnected for vh officer`);
                await this.refreshConferenceDataDuringDisconnect();
            })
        );

        this.eventService.start();
    }

    onConferenceSelected(conference: ConferenceForVhOfficerResponse) {
        this.logger.info(`Conference ${conference.id} selected`);
        if (!this.isCurrentConference(conference.id)) {
            this.clearSelectedConference();
            this.retrieveConferenceDetails(conference.id);
        }
    }

    handleConferenceStatusChange(message: ConferenceStatusMessage) {
        const conference = this.conferences.find(c => c.id === message.conferenceId);
        if (!conference) {
            return false;
        }
        conference.status = message.status;
        if (this.isCurrentConference(message.conferenceId)) {
            this.selectedHearing.getConference().status = message.status;
        }
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage): any {
        const participantInList = ConferenceHelper.findParticipantInConferences(
            this.conferences.map(x => x.getConference()),
            message.participantId
        );
        // update in list
        if (participantInList) {
            participantInList.status = message.status;
        }

        // update for hearing page
        if (this.isCurrentConference(message.conferenceId)) {
            const participantToUpdate = this.selectedHearing.participants.find(x => x.id === message.participantId);
            participantToUpdate.base.status = message.status;
        }
    }

    async refreshConferenceDataDuringDisconnect() {
        this.logger.warn('EventHub refresh pending...');
        this.retrieveHearingsForVhOfficer(true);
        if (this.selectedHearing) {
            await this.retrieveConferenceDetails(this.selectedHearing.id);
        }
    }

    getConferenceForSelectedAllocations() {
        this.loadVenueSelection();
        this.retrieveHearingsForVhOfficer(true);
        this.setupConferenceInterval();
    }

    loadVenueSelection(): void {
        const venues = this.venueAllocationStorage.get();
        this.venueAllocations = venues.map(v => v.name);
    }

    retrieveHearingsForVhOfficer(reload: boolean) {
        this.loadingData = reload;
        this.conferencesSubscription = this.videoWebService.getConferencesForVHOfficer(this.venueAllocations).subscribe(
            async (data: ConferenceForVhOfficerResponse[]) => {
                this.logger.debug('Successfully retrieved hearings for VHO');
                this.conferences = data.map(c => new HearingSummary(c));
                this.loadingData = false;
            },
            error => {
                this.logger.error('There was an error setting up VH Officer dashboard', error);
                this.loadingData = false;
                this.errorService.handleApiError(error);
            }
        );
    }

    setupConferenceInterval() {
        clearInterval(this.interval);
        this.interval = setInterval(() => {
            this.retrieveHearingsForVhOfficer(false);
        }, 30000);
    }

    isCurrentConference(conferenceId: string): boolean {
        return this.selectedHearing != null && this.selectedHearing.getConference().id === conferenceId;
    }

    clearSelectedConference() {
        this.selectedHearing = null;
    }

    async retrieveConferenceDetails(conferenceId: string) {
        try {
            const conference = await this.videoWebService.getConferenceByIdVHO(conferenceId);
            this.selectedHearing = new Hearing(conference);
        } catch (error) {
            this.logger.error(`There was an error when selecting conference ${conferenceId}`, error);
            this.errorService.handleApiError(error);
        }
    }

    onMenuSelected(menu: MenuOption) {
        this.selectedMenu = menu;
    }

    goBackToVenueSelection() {
        this.router.navigateByUrl(pageUrls.AdminVenueList);
    }
}
