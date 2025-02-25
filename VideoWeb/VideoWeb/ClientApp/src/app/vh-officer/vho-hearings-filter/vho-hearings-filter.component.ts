import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { HearingsFilter, ListFilter } from '../../shared/models/hearings-filter';
import { HearingsFilterOptionsService } from '../services/hearings-filter-options.service';

@Component({
    standalone: false,
    selector: 'app-vho-hearings-filter',
    templateUrl: './vho-hearings-filter.component.html',
    styleUrls: ['./vho-hearings-filter.component.scss', '../vho-global-styles.scss']
})
export class VhoHearingsFilterComponent implements OnInit {
    @Output()
    filterOptionsEvent = new EventEmitter<HearingsFilter>();
    statusAllChecked = true;
    alertsAllChecked = true;
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

    statusOptionSelected(optionIndex: number) {
        this.hearingsFilter.statuses[optionIndex].selected = !this.hearingsFilter.statuses[optionIndex].selected;
        this.countOptions();
    }

    alertOptionSelected(optionIndex: number) {
        this.hearingsFilter.alerts[optionIndex].selected = !this.hearingsFilter.alerts[optionIndex].selected;
        this.countOptions();
    }

    clearFilters() {
        this.statusAllSelected();
        this.alertAllSelected();
    }

    applyFilters() {
        this.hearingsFilter.numberFilterOptions = this.hearingsFilterOptionsService.countOptions(this.hearingsFilter);
        this.filterOptionsEvent.emit(this.hearingsFilter);
    }

    private removeOptions(options: ListFilter[]) {
        options.forEach(x => (x.selected = false));
    }

    private countOptions(changesMade: boolean = true) {
        this.statusAllChecked = !this.isSelectedFilterOptions(this.hearingsFilter.statuses);
        this.alertsAllChecked = !this.isSelectedFilterOptions(this.hearingsFilter.alerts);
        this.disableFilterApply = !changesMade;
    }

    private isSelectedFilterOptions(options: ListFilter[]): boolean {
        const selectedOptions = options.filter(x => x.selected);
        return selectedOptions && selectedOptions.length > 0;
    }
}
