import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { CourtRoomsAccountResponse } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { CourtRoomsAccounts } from 'src/app/vh-officer/services/models/court-rooms-accounts';
import { VhoQueryService } from 'src/app/vh-officer/services/vho-query-service.service';
import { pageUrls } from '../../page-url.constants';
import { VenueListComponentDirective } from '../venue-list.component';
import { LaunchDarklyService } from '../../../services/launch-darkly.service';

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
        protected ldService: LaunchDarklyService
    ) {
        super(videoWebService, router, vhoQueryService, logger, ldService);
    }

    ngOnInit() {
        super.ngOnInit();
        this.videoWebService.getCSOs().subscribe(value => {
            this.csos = value;
        });
    }

    async goToHearingList() {
        this.errorMessage = null;
        if (this.csosSelected) {
            this.selectedVenues = await this.videoWebService.getVenuesForAllocatedCSOs(this.selectedCsos).toPromise();
        }
        this.updateVenueSelection();
        const courtRoomAccounts = await this.vhoQueryService.getCourtRoomsAccounts(this.selectedVenues);
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
