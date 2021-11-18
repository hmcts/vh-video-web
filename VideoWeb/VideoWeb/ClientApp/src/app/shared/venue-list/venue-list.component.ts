import { Directive, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { SessionStorage } from 'src/app/services/session-storage';
import { CourtRoomsAccounts } from 'src/app/vh-officer/services/models/court-rooms-accounts';
import { VhoQueryService } from 'src/app/vh-officer/services/vho-query-service.service';
import { HearingVenueResponse } from '../../services/clients/api-client';
import { VhoStorageKeys } from '../../vh-officer/services/models/session-keys';

@Directive()
export abstract class VenueListComponent implements OnInit {
    protected readonly judgeAllocationStorage: SessionStorage<string[]>;
    protected readonly courtAccountsAllocationStorage: SessionStorage<CourtRoomsAccounts[]>;
    venues: HearingVenueResponse[];
    selectedVenues: string[];
    venueListLoading: boolean;
    filterCourtRoomsAccounts: CourtRoomsAccounts[];

    constructor(
        protected videoWebService: VideoWebService,
        protected router: Router,
        protected vhoQueryService: VhoQueryService,
        protected logger: Logger
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

    abstract goToHearingList();
}
