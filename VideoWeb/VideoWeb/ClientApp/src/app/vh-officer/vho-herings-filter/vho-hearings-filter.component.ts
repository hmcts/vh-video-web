import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { HearingsFilter, ListFilter } from '../../shared/models/hearings-filter';
import { ConferenceStatus } from '../../services/clients/api-client';
import { HearingsFilterOptionsService } from '../services/hearings-filter-options.service';

@Component({
    selector: 'app-vho-hearings-filter',
    templateUrl: './vho-hearings-filter.component.html',
    styleUrls: ['./vho-hearings-filter.component.scss']
})
export class VhoHearingsFilterComponent implements OnInit {
    @Output()
    optionsCounterEvent = new EventEmitter<number>();

    @Output()
    fiterOptionsEvent = new EventEmitter<HearingsFilter>();

    statusAllChecked = true
    locationAllChecked = true;
    alertsAllChecked = true;
    filterOptionsCounter = 0;

    hearingsFilter: HearingsFilter;

    constructor(private hearingsFilterOptionsService: HearingsFilterOptionsService) { }

    ngOnInit() {
        this.hearingsFilter = this.hearingsFilterOptionsService.filter;
        this.countOptions();
    }

    statusAllSelected() {
        this.statusAllChecked = !this.statusAllChecked;
        if (this.statusAllChecked) {
            this.removeOptions(this.hearingsFilter.filterStatuses);
        }
        this.countOptions();
    }

    locationAllSelected() {
        this.locationAllChecked = !this.locationAllChecked;
        if (this.locationAllChecked) {
            this.removeOptions(this.hearingsFilter.filterLocations);
        }
        this.countOptions();
    }

    alertAllSelected() {
        this.alertsAllChecked = !this.alertsAllChecked;
        if (this.alertsAllChecked) {
            this.removeOptions(this.hearingsFilter.filterAlerts);
        }
        this.countOptions();
    }

    removeOptions(options: ListFilter[]) {
        options.forEach(x => x.Selected = false);
    }

    statusOptionSelected(optionIndex: number) {
        this.hearingsFilter.filterStatuses[optionIndex].Selected = !this.hearingsFilter.filterStatuses[optionIndex].Selected;
        this.countOptions();
    }

    locationOptionSelected(optionIndex: number) {
        this.hearingsFilter.filterLocations[optionIndex].Selected = !this.hearingsFilter.filterLocations[optionIndex].Selected;
        this.countOptions();
    }

    alertOptionSelected(optionIndex: number) {
        this.hearingsFilter.filterAlerts[optionIndex].Selected = !this.hearingsFilter.filterAlerts[optionIndex].Selected;
        this.countOptions();
    }

    countOptions() {
        const countStatus = this.count(this.hearingsFilter.filterStatuses);
        this.statusAllChecked = countStatus == 0;

        const countLocation = this.count(this.hearingsFilter.filterLocations);
        this.locationAllChecked = countLocation == 0;

        const countAlert = this.count(this.hearingsFilter.filterAlerts);
        this.alertsAllChecked = countAlert == 0;

        this.filterOptionsCounter = countStatus + countLocation + countAlert;
        this.optionsCounterEvent.emit(this.filterOptionsCounter);
    }

    count(options: ListFilter[]) {
        let countOptions = 0;
        options.forEach(x => {
            if (x.Selected) {
                countOptions++;
            }
        });
        return countOptions;
    }

    clearFilters() {
        this.statusAllSelected();
        this.alertAllSelected();
        this.locationAllSelected();
    }

    applyFilters() {
        this.fiterOptionsEvent.emit(this.hearingsFilter);
    }
}
