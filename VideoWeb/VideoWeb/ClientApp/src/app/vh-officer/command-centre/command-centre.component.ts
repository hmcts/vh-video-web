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
    conferences: HearingSummary[];
    selectedHearing: Hearing;

    interval: NodeJS.Timer;
    loadingData: boolean;

    constructor(
        private videoWebService: VideoWebService,
        private errorService: ErrorService,
        private logger: Logger,
        private router: Router,
        private screenHelper: ScreenHelper
    ) {
        this.loadingData = false;
        this.venueAllocationStorage = new SessionStorage<HearingVenueResponse[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
    }

    ngOnInit(): void {
        this.selectedMenu = this.menuOption.Message;
        this.screenHelper.enableFullScreen(true);
        this.getConferenceForSelectedAllocations();
    }

    ngOnDestroy(): void {
        this.screenHelper.enableFullScreen(false);
        if (this.conferencesSubscription) {
            this.conferencesSubscription.unsubscribe();
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

    onConferenceSelected(conference: ConferenceForVhOfficerResponse) {
        this.logger.info(`Conference ${conference.id} selected`);
        if (!this.isCurrentConference(conference)) {
            this.clearSelectedConference();
            this.retrieveConferenceDetails(conference.id);
        }
    }

    isCurrentConference(conference: ConferenceForVhOfficerResponse): boolean {
        return this.selectedHearing != null && this.selectedHearing.getConference().id === conference.id;
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
