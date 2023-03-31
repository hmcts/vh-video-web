import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { CourtRoomsAccountResponse, JusticeUserResponse } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { CourtRoomsAccounts } from 'src/app/vh-officer/services/models/court-rooms-accounts';
import { VhoQueryService } from 'src/app/vh-officer/services/vho-query-service.service';
import { pageUrls } from '../../page-url.constants';
import { VenueListComponentDirective } from '../venue-list.component';
import { LaunchDarklyService } from '../../../services/launch-darkly.service';
import { ProfileService } from 'src/app/services/api/profile.service';
import { CsoFilter } from 'src/app/vh-officer/services/models/cso-filter';

@Component({
    selector: 'app-vh-officer-venue-list',
    templateUrl: '../venue-list.component.html',
    styleUrls: ['../venue-list.component.scss']
})
export class VhOfficerVenueListComponent extends VenueListComponentDirective implements OnInit {
    constructor(
        protected videoWebService: VideoWebService,
        protected router: Router,
        protected vhoQueryService: VhoQueryService,
        protected logger: Logger,
        protected ldService: LaunchDarklyService,
        protected profileService: ProfileService
    ) {
        super(videoWebService, router, vhoQueryService, logger, ldService);
    }

    static ALLOCATED_TO_ME = 'AllocatedToMe';
    static UNALLOCATED = 'Unallocated';

    ngOnInit() {
        super.ngOnInit();
        this.videoWebService.getCSOs().subscribe(value => {
            const items = [...value];
            items.unshift(
                new JusticeUserResponse({
                    id: VhOfficerVenueListComponent.ALLOCATED_TO_ME,
                    first_name: 'Allocated to me',
                    full_name: 'Allocated to me'
                }),
                new JusticeUserResponse({
                    id: VhOfficerVenueListComponent.UNALLOCATED,
                    first_name: 'Unallocated',
                    full_name: 'Unallocated'
                })
            );
            this.csos = items;
        });
    }

    async goToHearingList() {
        this.errorMessage = null;
        let includeUnallocated = false;
        const allocatedCsoIds = [...this.selectedCsos];
        if (this.csosSelected) {
            if (allocatedCsoIds.find(c => c === VhOfficerVenueListComponent.ALLOCATED_TO_ME)) {
                const loggedInUser = await this.profileService.getUserProfile();
                const loggedInCsoId = this.csos.find(c => c.username === loggedInUser.username).id; // TODO error handling
                if (!allocatedCsoIds.find(c => c === loggedInCsoId)) {
                    allocatedCsoIds.push(loggedInCsoId);
                }
                const index = allocatedCsoIds.findIndex(c => c === VhOfficerVenueListComponent.ALLOCATED_TO_ME);
                allocatedCsoIds.splice(index, 1);
            }
            if (allocatedCsoIds.find(c => c === VhOfficerVenueListComponent.UNALLOCATED)) {
                const index = allocatedCsoIds.findIndex(c => c === VhOfficerVenueListComponent.UNALLOCATED);
                allocatedCsoIds.splice(index, 1);
                includeUnallocated = true;
            }

            this.selectedVenues = await this.videoWebService.getVenuesForAllocatedCSOs(allocatedCsoIds, includeUnallocated).toPromise();
        }
        this.updateVenueSelection();
        this.csoAllocationStorage.set(new CsoFilter(allocatedCsoIds, includeUnallocated));

        const courtRoomAccounts = await this.vhoQueryService.getCourtRoomsAccounts(
            this.selectedVenues,
            allocatedCsoIds,
            includeUnallocated
        );
        if (this.venuesSelected) {
            this.getFiltersCourtRoomsAccounts(courtRoomAccounts);
            await this.router.navigateByUrl(pageUrls.AdminHearingList);
        } else {
            this.logger.warn('[VenueList] - No venues selected');
            this.errorMessage = 'Failed to find venues';
        }
    }

    private getFiltersCourtRoomsAccounts(response: CourtRoomsAccountResponse[]) {
        const updateFilterSelection = (filterVenue: CourtRoomsAccounts) => {
            const courtroomAccount = this.filterCourtRoomsAccounts.find(x => x.venue === filterVenue.venue);
            if (courtroomAccount) {
                courtroomAccount.selected = filterVenue.selected;
                courtroomAccount.updateRoomSelection(filterVenue.courtsRooms);
            }
        };
        this.filterCourtRoomsAccounts = response.map(x => new CourtRoomsAccounts(x.first_name, x.last_names, true));
        const previousFilter = this.courtAccountsAllocationStorage.get();
        if (previousFilter) {
            previousFilter.forEach(x => updateFilterSelection(x));
        }
        this.courtAccountsAllocationStorage.set(this.filterCourtRoomsAccounts);
        this.logger.info('[VenueList] - Venue selection is changed');
    }

    get showVhoSpecificContent(): boolean {
        return true;
    }
}
