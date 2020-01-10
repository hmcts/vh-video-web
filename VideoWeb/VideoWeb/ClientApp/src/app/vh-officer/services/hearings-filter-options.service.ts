import { Injectable } from '@angular/core';
import { HearingsFilter } from '../../shared/models/hearings-filter';

@Injectable({
    providedIn: 'root'
})
export class HearingsFilterOptionsService {

    hearingsFilter: HearingsFilter;

    setFilterOptions() {
        this.hearingsFilter = new HearingsFilter();
        this.setLocations();
        this.setAlerts();
        return this.hearingsFilter;
    }

    private setLocations() {
        const locations = ['Taylor House', 'Ambridge MC', 'Manchester', 'Glasgow'];
        this.hearingsFilter.addLocations(locations);
    }

    private setAlerts() {
        const alerts = ['Suspended', 'Disconnected', 'Cam/mic blocked', 'Self-test failed'];
        this.hearingsFilter.addAlerts(alerts);
    }

    get filter() {
        if (!this.hearingsFilter) {
            this.setFilterOptions();
        }
        return this.hearingsFilter;
    }
}

