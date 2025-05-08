import { Directive, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { SessionStorage } from 'src/app/services/session-storage';
import { CourtRoomsAccounts } from 'src/app/vh-officer/services/models/court-rooms-accounts';
import { VhoQueryService } from 'src/app/vh-officer/services/vho-query-service.service';
import { HearingVenueResponse, JusticeUserResponse, Role } from '../../services/clients/api-client';
import { VhoStorageKeys } from '../../vh-officer/services/models/session-keys';
import { FEATURE_FLAGS, LaunchDarklyService } from '../../services/launch-darkly.service';
import { CsoFilter } from 'src/app/vh-officer/services/models/cso-filter';
import { ProfileService } from 'src/app/services/api/profile.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

@Directive()
export abstract class VenueListComponentDirective implements OnInit, OnDestroy, AfterViewInit {
    static readonly ALLOCATED_TO_ME = 'AllocatedToMe';
    static readonly UNALLOCATED = 'Unallocated';

    venues: HearingVenueResponse[];
    csos: JusticeUserResponse[];
    selectedVenues: string[];
    selectedCsos: string[];
    filterCourtRoomsAccounts: CourtRoomsAccounts[];
    errorMessage: string | null;
    vhoWorkAllocationFeatureFlag: boolean;
    activeSessionsFeatureFlag = false;
    activeSessions: boolean;
    isAdministrator: boolean;

    protected readonly judgeAllocationStorage: SessionStorage<string[]>;
    protected readonly courtAccountsAllocationStorage: SessionStorage<CourtRoomsAccounts[]>;
    protected readonly csoAllocationStorage: SessionStorage<CsoFilter>;
    protected readonly activeSessionsStorage: SessionStorage<boolean>;

    private onDestroy$ = new Subject<void>();

    constructor(
        protected videoWebService: VideoWebService,
        protected router: Router,
        protected vhoQueryService: VhoQueryService,
        protected logger: Logger,
        protected ldService: LaunchDarklyService,
        protected profileService: ProfileService,
        protected translateService: TranslateService
    ) {
        this.selectedVenues = [];
        this.selectedCsos = [];
        this.errorMessage = null;
        this.judgeAllocationStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
        this.courtAccountsAllocationStorage = new SessionStorage<CourtRoomsAccounts[]>(VhoStorageKeys.COURT_ROOMS_ACCOUNTS_ALLOCATION_KEY);
        this.csoAllocationStorage = new SessionStorage<CsoFilter>(VhoStorageKeys.CSO_ALLOCATIONS_KEY);
        this.activeSessionsStorage = new SessionStorage<boolean>(VhoStorageKeys.ACTIVE_SESSIONS_END_OF_DAY_KEY);
    }

    get venuesSelected(): boolean {
        return this.selectedVenues && this.selectedVenues.length > 0;
    }

    get csosSelected(): boolean {
        return this.selectedCsos && this.selectedCsos.length > 0;
    }

    abstract get showVhoSpecificContent(): boolean;

    ngOnInit() {
        this.activeSessions = this.activeSessionsStorage.get();
        this.setupSubscribers();
        this.profileService.getUserProfile().then(user => {
            this.isAdministrator = user.roles.includes(Role.Administrator);
        });
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.removeAriaPlaceholderAttributes();
        }, 0);
    }

    ngOnDestroy(): void {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }

    onDropdownOpen(): void {
        setTimeout(() => {
            
            const listbox1 = document.querySelector('.ng-dropdown-panel.ng-select-multiple.ng-select-bottom');
            if (listbox1) {
                listbox1.removeAttribute('role');
            }
            
            const listbox = document.querySelector('.ng-dropdown-panel-items[role="listbox"]');
            const ariaLabel = this.translateService.instant('venue-list.allocation-list-label');
            if (listbox) {
                listbox.setAttribute('aria-label', ariaLabel);
                listbox.setAttribute('title', ariaLabel);
                listbox.setAttribute('tabindex', '0');
            }

            // const nestedDiv = document.querySelector('.ng-dropdown-panel-items');
            // if (nestedDiv) {
            //     nestedDiv.setAttribute('role', 'listbox');
            // }
        });
    }

    updateVenueSelection() {
        this.selectedCsos = [];
        this.judgeAllocationStorage.set(this.selectedVenues);
        this.csoAllocationStorage.clear();
        this.activeSessionsStorage.clear();
    }

    async updateCsoSelection() {
        this.selectedVenues = [];
        this.csoAllocationStorage.set(await this.getCsoFilter());
        this.judgeAllocationStorage.clear();
        this.activeSessionsStorage.clear();
    }

    updateActiveSessionSelection() {
        this.activeSessions = !this.activeSessions;
        if (this.activeSessions) {
            this.selectedVenues = [];
            this.selectedCsos = [];
            this.csoAllocationStorage.clear();
            this.judgeAllocationStorage.clear();
            this.activeSessionsStorage.set(true);
        } else {
            this.activeSessionsStorage.clear();
        }
    }

    async getCsoFilter(): Promise<CsoFilter> {
        let includeUnallocated: boolean;
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

    private setupSubscribers() {
        this.ldService
            .getFlag<boolean>(FEATURE_FLAGS.activeSessionFilter, false)
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(value => {
                this.activeSessionsFeatureFlag = value;
            });

        this.videoWebService.getVenues().subscribe(venues => {
            this.venues = venues;
            this.selectedVenues = this.judgeAllocationStorage.get();
        });
    }

    private removeAriaPlaceholderAttributes() {
        // Accessibility workaround to remove invalid aria-placeholder attribute from ng-select generated inputs
        const inputIds = ['#venue-allocation-list input', '#cso-allocation-list input'];
        inputIds.forEach(id => {
            const input = document.querySelector(id);
            input?.removeAttribute('aria-placeholder');
        });
    }

    abstract goToHearingList();
}
