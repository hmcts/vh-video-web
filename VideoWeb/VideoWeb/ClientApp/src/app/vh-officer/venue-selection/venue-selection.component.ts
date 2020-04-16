import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { HearingVenueResponse } from 'src/app/services/clients/api-client';
import { IDropdownSettings } from 'ng-multiselect-dropdown';

@Component({
    selector: 'app-venue-selection',
    templateUrl: './venue-selection.component.html',
    styleUrls: ['./venue-selection.component.scss']
})
export class VenueSelectionComponent implements OnInit {
    venues: HearingVenueResponse[];
    selectedVenues: HearingVenueResponse[];
    @Output() selectedAllocations = new EventEmitter<HearingVenueResponse[]>();

    dropdownSettings: IDropdownSettings;

    constructor(private videoWebService: VideoWebService) {}

    ngOnInit() {
        this.videoWebService.getHearingVenues().then((response) => (this.venues = response));
        this.initDropDown();
    }

    private initDropDown() {
        this.dropdownSettings = {
            singleSelection: false,
            idField: 'id',
            textField: 'name',
            selectAllText: 'Select All',
            unSelectAllText: 'UnSelect All',
            itemsShowLimit: 3,
            allowSearchFilter: true
        };
    }

    publishSelection() {
        console.log(this.selectedVenues);
        this.selectedAllocations.emit(this.selectedVenues);
    }

    onItemSelect(item: HearingVenueResponse) {
        const existingVenue = this.selectedVenues.find((x) => x.id === item.id);
        if (!existingVenue) {
            this.selectedVenues.push(this.venues.find((x) => x.id === item.id));
        }
    }

    onItemDeSelect(item: HearingVenueResponse) {
        this.selectedVenues.filter((x) => x.id !== item.id);
    }

    onSelectAll() {
        this.selectedVenues = this.venues;
    }
}
