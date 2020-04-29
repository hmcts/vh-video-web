import { Injectable } from '@angular/core';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { SessionStorage } from '../../services/session-storage';
import {
    AlertFilter,
    AlertsStatus,
    ExtendedConferenceStatus,
    HearingsFilter,
    ListFilter,
    StatusFilter
} from '../../shared/models/hearings-filter';
import { VhoStorageKeys } from './models/session-keys';

@Injectable({
    providedIn: 'root'
})
export class HearingsFilterOptionsService {
    private hearingsFilter: HearingsFilter;
    private readonly hearingsFilterStorage: SessionStorage<HearingsFilter>;

    constructor() {
        this.hearingsFilterStorage = new SessionStorage(VhoStorageKeys.HEARINGS_FITER_KEY);
    }

    getFilter() {
        this.hearingsFilter = this.hearingsFilterStorage.get();
        if (!this.hearingsFilter) {
            this.setFilterOptions();
        }
        this.hearingsFilter.numberFilterOptions = this.countOptions(this.hearingsFilter);
        return this.hearingsFilter;
    }

    private setFilterOptions() {
        this.hearingsFilter = new HearingsFilter();
        this.setStatuses();
        this.setAlerts();

        return this.hearingsFilter;
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
        return this.count(filter.statuses) + this.count(filter.alerts);
    }

    private count(options: ListFilter[]) {
        let countOptions = 0;
        options.forEach((x) => {
            if (x.selected) {
                countOptions++;
            }
        });
        return countOptions;
    }
}
