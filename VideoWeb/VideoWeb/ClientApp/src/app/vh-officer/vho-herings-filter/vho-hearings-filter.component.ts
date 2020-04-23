import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { HearingsFilter, ListFilter } from '../../shared/models/hearings-filter';
import { HearingsFilterOptionsService } from '../services/hearings-filter-options.service';

@Component({
    selector: 'app-vho-hearings-filter',
    templateUrl: './vho-hearings-filter.component.html',
    styleUrls: ['./vho-hearings-filter.component.scss']
})
export class VhoHearingsFilterComponent implements OnInit {
    @Output()
    fiterOptionsEvent = new EventEmitter<HearingsFilter>();

    statusAllChecked = true;
    alertsAllChecked = true;
    filterOptionsCounter = 0;
    disableFilterApply = true;

    hearingsFilter: HearingsFilter;

    constructor(private hearingsFilterOptionsService: HearingsFilterOptionsService) {}

    ngOnInit() {
        this.hearingsFilter = this.hearingsFilterOptionsService.getFilter();
        this.countOptions(false);
    }

    statusAllSelected() {
        this.statusAllChecked = !this.statusAllChecked;
        if (this.statusAllChecked) {
            this.removeOptions(this.hearingsFilter.statuses);
        }
        this.countOptions();
    }

    alertAllSelected() {
        this.alertsAllChecked = !this.alertsAllChecked;
        if (this.alertsAllChecked) {
            this.removeOptions(this.hearingsFilter.alerts);
        }
        this.countOptions();
    }

    private removeOptions(options: ListFilter[]) {
        options.forEach((x) => (x.Selected = false));
    }

    statusOptionSelected(optionIndex: number) {
        this.hearingsFilter.statuses[optionIndex].Selected = !this.hearingsFilter.statuses[optionIndex].Selected;
        this.countOptions();
    }

    alertOptionSelected(optionIndex: number) {
        this.hearingsFilter.alerts[optionIndex].Selected = !this.hearingsFilter.alerts[optionIndex].Selected;
        this.countOptions();
    }

    private countOptions(changesMade: boolean = true) {
        this.statusAllChecked = !this.isSelectedFilterOptions(this.hearingsFilter.statuses);
        this.alertsAllChecked = !this.isSelectedFilterOptions(this.hearingsFilter.alerts);
        this.disableFilterApply = !changesMade;
    }

    private isSelectedFilterOptions(options: ListFilter[]): boolean {
        const selectedOptions = options.filter((x) => x.Selected);
        return selectedOptions && selectedOptions.length > 0;
    }

    clearFilters() {
        this.statusAllSelected();
        this.alertAllSelected();
    }

    applyFilters() {
        this.hearingsFilter.numberFilterOptions = this.hearingsFilterOptionsService.countOptions(this.hearingsFilter);
        this.fiterOptionsEvent.emit(this.hearingsFilter);
    }
}
