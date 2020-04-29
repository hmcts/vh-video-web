import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { HearingVenueResponse } from 'src/app/services/clients/api-client';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
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
    dropdownSettings: IDropdownSettings;

    constructor(private videoWebService: VideoWebService, private router: Router) {
        this.selectedVenues = [];
        this.venueAllocationStorage = new SessionStorage<HearingVenueResponse[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
    }

    async ngOnInit() {
        this.videoWebService.getHearingVenues().then((response) => {
            this.venues = response;
            this.selectedVenues = this.venueAllocationStorage.get();
        });
        this.initDropDown();
    }

    private initDropDown() {
        this.dropdownSettings = {
            singleSelection: false,
            idField: 'id',
            textField: 'name',
            selectAllText: 'Select All',
            unSelectAllText: 'Unselect All',
            itemsShowLimit: 1,
            allowSearchFilter: true,
            searchPlaceholderText: 'Search venue name'
        };
    }

    get venuesSelected(): boolean {
        return this.selectedVenues && this.selectedVenues.length > 0;
    }

    onItemSelect(venue: HearingVenueResponse) {
        const existingVenue = this.selectedVenues.find((x) => x.id === venue.id);
        if (!existingVenue) {
            this.selectedVenues.push(this.venues.find((x) => x.id === venue.id));
        }
    }

    onItemDeselect(venue: HearingVenueResponse) {
        this.selectedVenues = this.selectedVenues.filter((x) => x.id !== venue.id);
    }

    onSelectAll() {
        this.selectedVenues = this.venues;
    }

    updateSelection() {
        if (this.venuesSelected) {
            this.venueAllocationStorage.set(this.selectedVenues);
        }
    }

    goToHearingList() {
        this.updateSelection();
        this.router.navigateByUrl(pageUrls.AdminHearingList);
    }
}
