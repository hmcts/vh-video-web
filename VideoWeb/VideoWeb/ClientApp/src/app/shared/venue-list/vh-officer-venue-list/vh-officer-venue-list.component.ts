import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { CourtRoomsAccountResponse } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { CourtRoomsAccounts } from 'src/app/vh-officer/services/models/court-rooms-accounts';
import { VhoQueryService } from 'src/app/vh-officer/services/vho-query-service.service';
import { pageUrls } from '../../page-url.constants';
import { VenueListComponentDirective } from '../venue-list.component';

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
        protected logger: Logger
    ) {
        super(videoWebService, router, vhoQueryService, logger);
    }

    goToHearingList() {
        this.updateSelection();
        this.vhoQueryService.getCourtRoomsAccounts(this.selectedVenues).then(response => {
            this.getFiltersCourtRoomsAccounts(response);
            this.router.navigateByUrl(pageUrls.AdminHearingList);
        });
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
}
