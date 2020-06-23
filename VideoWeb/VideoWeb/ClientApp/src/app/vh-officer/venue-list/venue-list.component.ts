import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { SessionStorage } from 'src/app/services/session-storage';
import { VhoStorageKeys } from '../services/models/session-keys';
import { CourtRoomsAccounts } from 'src/app/vh-officer/services/models/court-rooms-accounts';

@Component({
    selector: 'app-venue-list',
    templateUrl: './venue-list.component.html',
    styleUrls: ['./venue-list.component.scss']
})
export class VenueListComponent implements OnInit {
    private readonly judgeAllocationStorage: SessionStorage<string[]>;
    private readonly courtAccountsAllocationStorage: SessionStorage<CourtRoomsAccounts[]>;
    judges: string[];
    selectedJudges: string[];
    venueListLoading: boolean;
    filterCourtRoomsAccounts: CourtRoomsAccounts[];

    constructor(private videoWebService: VideoWebService, private router: Router) {
        this.selectedJudges = [];
        this.judgeAllocationStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
        this.courtAccountsAllocationStorage = new SessionStorage<CourtRoomsAccounts[]>(VhoStorageKeys.COURT_ROOMS_ACCOUNTS_ALLOCATION_KEY);
    }

    async ngOnInit() {
        this.venueListLoading = false;
        this.videoWebService.getDistinctJudgeNames().then(response => {
            this.judges = response.first_names;
            this.selectedJudges = this.judgeAllocationStorage.get();
            this.venueListLoading = false;
        });
    }

    get venuesSelected(): boolean {
        return this.selectedJudges && this.selectedJudges.length > 0;
    }

    updateSelection() {
        this.judgeAllocationStorage.set(this.selectedJudges);
        this.getFiltersCourtRoomsAccounts();
    }

    getFiltersCourtRoomsAccounts() {
        this.videoWebService.getCourtRoomsAccounts(this.selectedJudges).then(response => {
            this.filterCourtRoomsAccounts = response.map(x => new CourtRoomsAccounts(x.venue, x.court_rooms, true));
            const previousFilter = this.courtAccountsAllocationStorage.get();
            if (previousFilter) {
                previousFilter.forEach(x => this.updateFilterSelection(x));
            }
            this.courtAccountsAllocationStorage.set(this.filterCourtRoomsAccounts);
        });
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
        this.router.navigateByUrl(pageUrls.AdminHearingList);
    }
}
