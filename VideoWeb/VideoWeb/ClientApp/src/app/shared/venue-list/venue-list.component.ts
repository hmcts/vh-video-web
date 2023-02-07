import { Directive, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { SessionStorage } from 'src/app/services/session-storage';
import { CourtRoomsAccounts } from 'src/app/vh-officer/services/models/court-rooms-accounts';
import { VhoQueryService } from 'src/app/vh-officer/services/vho-query-service.service';
import { HearingVenueResponse, JusticeUserResponse } from '../../services/clients/api-client';
import { VhoStorageKeys } from '../../vh-officer/services/models/session-keys';
import { FEATURE_FLAGS, LaunchDarklyService } from '../../services/launch-darkly.service';

@Directive()
export abstract class VenueListComponentDirective implements OnInit {
    protected readonly judgeAllocationStorage: SessionStorage<string[]>;
    protected readonly courtAccountsAllocationStorage: SessionStorage<CourtRoomsAccounts[]>;
    venues: HearingVenueResponse[];
    csos: JusticeUserResponse[];
    selectedVenues: string[];
    selectedCsos: string[];
    filterCourtRoomsAccounts: CourtRoomsAccounts[];
    errorMessage: string | null;
    vhoWorkAllocationFeatureFlag: boolean;
    constructor(
        protected videoWebService: VideoWebService,
        protected router: Router,
        protected vhoQueryService: VhoQueryService,
        protected logger: Logger,
        protected ldService: LaunchDarklyService
    ) {
        this.selectedVenues = [];
        this.selectedCsos = [];
        this.errorMessage = null;
        this.judgeAllocationStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
        this.courtAccountsAllocationStorage = new SessionStorage<CourtRoomsAccounts[]>(VhoStorageKeys.COURT_ROOMS_ACCOUNTS_ALLOCATION_KEY);
    }

    ngOnInit() {
        this.setupSubscribers();
    }

    private setupSubscribers() {
        this.ldService.flagChange.subscribe(value => {
            if (value) {
                this.vhoWorkAllocationFeatureFlag = value[FEATURE_FLAGS.vhoWorkAllocation];
            }
        });

        this.videoWebService.getVenues().subscribe(venues => {
            this.venues = venues;
            this.selectedVenues = this.judgeAllocationStorage.get();
        });
    }
    abstract goToHearingList();
    abstract get showVhoSpecificContent(): boolean;
    get venuesSelected(): boolean {
        return this.selectedVenues && this.selectedVenues.length > 0;
    }

    get csosSelected(): boolean {
        return this.selectedCsos && this.selectedCsos.length > 0;
    }

    updateVenueSelection() {
        this.selectedCsos = [];
        this.judgeAllocationStorage.set(this.selectedVenues);
    }
    clearVenue() {
        this.selectedVenues = [];
    }
}
