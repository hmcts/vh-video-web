import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { HearingVenueResponse } from 'src/app/services/clients/api-client';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { SessionStorage } from 'src/app/services/session-storage';
import { VhoStorageKeys } from '../services/models/session-keys';

@Component({
    selector: 'app-venue-list',
    templateUrl: './venue-list.component.html',
    styleUrls: ['./venue-list.component.scss']
})
export class VenueListComponent implements OnInit {
    private readonly venueAllocationStorage: SessionStorage<HearingVenueResponse[]>;
    venues: HearingVenueResponse[];
    selectedVenues: HearingVenueResponse[];
    venueListLoading: boolean;

    constructor(private videoWebService: VideoWebService, private router: Router) {
        this.selectedVenues = [];
        this.venueAllocationStorage = new SessionStorage<HearingVenueResponse[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
    }

    async ngOnInit() {
        this.venueListLoading = false;
        this.videoWebService.getHearingVenues().then(response => {
            this.venues = response;
            this.selectedVenues = this.venueAllocationStorage.get();
            this.venueListLoading = false;
        });
    }

    get venuesSelected(): boolean {
        return this.selectedVenues.length > 0;
    }

    updateSelection() {
        this.venueAllocationStorage.set(this.selectedVenues);
    }

    goToHearingList() {
        this.updateSelection();
        this.router.navigateByUrl(pageUrls.AdminHearingList);
    }
}
