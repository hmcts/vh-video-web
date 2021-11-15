import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { SessionStorage } from 'src/app/services/session-storage';
import { VhoStorageKeys } from '../../vh-officer/services/models/session-keys';
import { CourtRoomsAccounts } from 'src/app/vh-officer/services/models/court-rooms-accounts';
import { VhoQueryService } from 'src/app/vh-officer/services/vho-query-service.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { CourtRoomsAccountResponse, HearingVenueResponse } from '../../services/clients/api-client';

@Component({
    selector: 'app-venue-list',
    templateUrl: './venue-list.component.html',
    styleUrls: ['./venue-list.component.scss']
})
export class VenueListComponent implements OnInit {
    private readonly judgeAllocationStorage: SessionStorage<string[]>;
    private readonly courtAccountsAllocationStorage: SessionStorage<CourtRoomsAccounts[]>;
    venues: HearingVenueResponse[];
    selectedVenues: string[];
    venueListLoading: boolean;
    filterCourtRoomsAccounts: CourtRoomsAccounts[];

    constructor(
        private videoWebService: VideoWebService,
        private router: Router,
        private vhoQueryService: VhoQueryService,
        private logger: Logger
    ) {
        this.selectedVenues = [];
        this.judgeAllocationStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
        this.courtAccountsAllocationStorage = new SessionStorage<CourtRoomsAccounts[]>(VhoStorageKeys.COURT_ROOMS_ACCOUNTS_ALLOCATION_KEY);
    }

    ngOnInit() {
        this.venueListLoading = false;
        this.videoWebService.getVenues().subscribe(venues => {
            this.venues = venues;
            this.selectedVenues = this.judgeAllocationStorage.get();
            this.venueListLoading = false;
        });
    }

    get venuesSelected(): boolean {
        return this.selectedVenues && this.selectedVenues.length > 0;
    }

    updateSelection() {
        this.judgeAllocationStorage.set(this.selectedVenues);
    }

    getFiltersCourtRoomsAccounts(response: CourtRoomsAccountResponse[]) {
        if (this.venuesSelected) {
            this.filterCourtRoomsAccounts = response.map(x => new CourtRoomsAccounts(x.first_name, x.last_names, true));
            const previousFilter = this.courtAccountsAllocationStorage.get();
            if (previousFilter) {
                previousFilter.forEach(x => this.updateFilterSelection(x));
            }
            this.courtAccountsAllocationStorage.set(this.filterCourtRoomsAccounts);
            this.logger.info('[VenueList] - Venue selection is changed');
        } else {
            this.logger.warn('[VenueList] - No venues selected');
        }
    }

    updateFilterSelection(filterVenue: CourtRoomsAccounts) {
        const courtroomAccount = this.filterCourtRoomsAccounts.find(x => x.venue === filterVenue.venue);
        if (courtroomAccount) {
            courtroomAccount.selected = filterVenue.selected;
            courtroomAccount.updateRoomSelection(filterVenue.courtsRooms);
        }
    }

    goToHearingList() {
        this.updateSelection();
        this.vhoQueryService.getCourtRoomsAccounts(this.selectedVenues).then(response => {
            this.getFiltersCourtRoomsAccounts(response);
            this.router.navigateByUrl(pageUrls.AdminHearingList);
        });
    }
}