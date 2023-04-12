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
import { CsoFilter } from 'src/app/vh-officer/services/models/cso-filter';
import { ProfileService } from 'src/app/services/api/profile.service';

@Directive()
export abstract class VenueListComponentDirective implements OnInit {
    constructor(
        protected videoWebService: VideoWebService,
        protected router: Router,
        protected vhoQueryService: VhoQueryService,
        protected logger: Logger,
        protected ldService: LaunchDarklyService,
        protected profileService: ProfileService
    ) {
        this.selectedVenues = [];
        this.selectedCsos = [];
        this.errorMessage = null;
        this.judgeAllocationStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
        this.courtAccountsAllocationStorage = new SessionStorage<CourtRoomsAccounts[]>(VhoStorageKeys.COURT_ROOMS_ACCOUNTS_ALLOCATION_KEY);
        this.csoAllocationStorage = new SessionStorage<CsoFilter>(VhoStorageKeys.CSO_ALLOCATIONS_KEY);
    }
    abstract get showVhoSpecificContent(): boolean;
    get venuesSelected(): boolean {
        return this.selectedVenues && this.selectedVenues.length > 0;
    }

    get csosSelected(): boolean {
        return this.selectedCsos && this.selectedCsos.length > 0;
    }

    static ALLOCATED_TO_ME = 'AllocatedToMe';
    static UNALLOCATED = 'Unallocated';
    protected readonly judgeAllocationStorage: SessionStorage<string[]>;
    protected readonly courtAccountsAllocationStorage: SessionStorage<CourtRoomsAccounts[]>;
    protected readonly csoAllocationStorage: SessionStorage<CsoFilter>;
    venues: HearingVenueResponse[];
    csos: JusticeUserResponse[];
    selectedVenues: string[];
    selectedCsos: string[];
    filterCourtRoomsAccounts: CourtRoomsAccounts[];
    errorMessage: string | null;
    vhoWorkAllocationFeatureFlag: boolean;

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

    updateVenueSelection() {
        this.selectedCsos = [];
        this.judgeAllocationStorage.set(this.selectedVenues);
        this.csoAllocationStorage.clear();
    }
    async updateCsoSelection() {
        this.selectedVenues = [];
        this.csoAllocationStorage.set(await this.getCsoFilter());
        this.judgeAllocationStorage.clear();
    }
    async getCsoFilter(): Promise<CsoFilter> {
        let includeUnallocated = false;
        const allocatedCsoIds = [...this.selectedCsos];

        if (allocatedCsoIds.find(c => c === VenueListComponentDirective.ALLOCATED_TO_ME)) {
            const loggedInCso = await this.getLoggedInCso(this.csos);
            const loggedInCsoId = loggedInCso.id;
            if (!allocatedCsoIds.find(c => c === loggedInCsoId)) {
                allocatedCsoIds.push(loggedInCsoId);
            }
            const index = allocatedCsoIds.findIndex(c => c === VenueListComponentDirective.ALLOCATED_TO_ME);
            allocatedCsoIds.splice(index, 1);
        }
        if (allocatedCsoIds.find(c => c === VenueListComponentDirective.UNALLOCATED)) {
            const index = allocatedCsoIds.findIndex(c => c === VenueListComponentDirective.UNALLOCATED);
            allocatedCsoIds.splice(index, 1);
            includeUnallocated = true;
        }
        return new CsoFilter(allocatedCsoIds, includeUnallocated);
    }
    async getLoggedInCso(users: JusticeUserResponse[]): Promise<JusticeUserResponse> {
        const loggedInUser = await this.profileService.getUserProfile();
        const loggedInCso = users.find(c => c.username?.toUpperCase() === loggedInUser.username.toUpperCase());
        return loggedInCso;
    }
}
