import { Injectable } from '@angular/core';
import {
    HearingsFilter,
    ListFilter,
    StatusFilter,
    ExtendedConferenceStatus,
    AlertsStatus,
    AlertFilter
} from '../../shared/models/hearings-filter';
import { SessionStorage } from '../../services/session-storage';
import { ConferenceStatus, HearingVenueResponse } from 'src/app/services/clients/api-client';
import { VideoWebService } from 'src/app/services/api/video-web.service';

@Injectable({
    providedIn: 'root'
})
export class HearingsFilterOptionsService {
    private hearingsFilter: HearingsFilter;
    private readonly hearingsFilterStorage: SessionStorage<HearingsFilter>;
    readonly HEARINGS_FITER_KEY = 'vho.hearings.filter';

    constructor(private videoWebService: VideoWebService) {
        this.hearingsFilterStorage = new SessionStorage(this.HEARINGS_FITER_KEY);
    }

    async getFilter() {
        this.hearingsFilter = this.hearingsFilterStorage.get();
        if (!this.hearingsFilter) {
            await this.setFilterOptions();
        }
        this.hearingsFilter.numberFilterOptions = this.countOptions(this.hearingsFilter);
        return this.hearingsFilter;
    }

    private async setFilterOptions() {
        this.hearingsFilter = new HearingsFilter();
        this.setStatuses();
        await this.setLocations();
        this.setAlerts();

        return this.hearingsFilter;
    }

    private async setLocations() {
        const locations = await this.videoWebService.getHearingVenues();
        this.addLocations(locations);
    }

    private setAlerts() {
        const alertsStatuses = Object.values(AlertsStatus);
        this.addAlerts(alertsStatuses);
    }

    private setStatuses() {
        const hearingsStatuses = Object.values(ConferenceStatus);
        this.addStatuses(hearingsStatuses);
    }

    private addStatuses(hearingsStatuses: ConferenceStatus[]) {
        hearingsStatuses.forEach((conferenceStatus) => {
            const description = this.setHearingsStatuses(conferenceStatus);
            const itemStatus = new StatusFilter(description, conferenceStatus, false);
            this.hearingsFilter.statuses.push(itemStatus);
        });
        this.hearingsFilter.statuses.push(new StatusFilter('Delayed', ExtendedConferenceStatus.Delayed, false));
    }

    private addLocations(locations: HearingVenueResponse[]) {
        locations.forEach((location) => {
            const itemLocation = new ListFilter(location.name, false);
            this.hearingsFilter.locations.push(itemLocation);
        });
    }

    private addAlerts(alerts: AlertsStatus[]) {
        alerts.forEach((alert) => {
            const itemAlert = this.setAlertStatuses(alert);
            this.hearingsFilter.alerts.push(itemAlert);
        });
    }
    private setAlertStatuses(alertStatus: AlertsStatus) {
        let description = '';
        let bodyText = '';
        switch (alertStatus) {
            case AlertsStatus.Disconnected:
                description = 'Disconnected';
                bodyText = 'Disconnected';
                break;
            case AlertsStatus.Suspended:
                description = 'Suspended';
                bodyText = 'Suspended';
                break;
            case AlertsStatus.FailedSelfTest:
                description = 'Self-test failed';
                bodyText = 'self-test';
                break;
            case AlertsStatus.MediaBlocked:
                description = 'Cam/mic blocked';
                bodyText = 'Media blocked';
                break;
            default:
        }

        return new AlertFilter(description, alertStatus, bodyText, false);
    }

    private setHearingsStatuses(conferenceStatus: ConferenceStatus) {
        let description = '';
        switch (conferenceStatus) {
            case ConferenceStatus.Suspended:
                description = 'Suspended';
                break;
            case ConferenceStatus.NotStarted:
                description = 'Not started';
                break;
            case ConferenceStatus.InSession:
                description = 'In session';
                break;
            case ConferenceStatus.Paused:
                description = 'Paused';
                break;
            case ConferenceStatus.Closed:
                description = 'Closed';
                break;
            default:
                description = '';
        }

        return description;
    }

    countOptions(filter: HearingsFilter) {
        return this.count(filter.statuses) + this.count(filter.locations) + this.count(filter.alerts);
    }

    private count(options: ListFilter[]) {
        let countOptions = 0;
        options.forEach((x) => {
            if (x.Selected) {
                countOptions++;
            }
        });
        return countOptions;
    }
}
