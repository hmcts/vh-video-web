import { Injectable } from '@angular/core';
import { ActivatedRoute, NavigationEnd, ParamMap, Router } from '@angular/router';
import { Guid } from 'guid-typescript';
import { BehaviorSubject, Observable, ReplaySubject, Subscription } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { ApiClient, ConferenceResponse, ConferenceStatus } from '../clients/api-client';
import { EventsService } from '../events.service';
import { ConferenceStatusMessage } from '../models/conference-status-message';

@Injectable({
    providedIn: 'root'
})
export class ConferenceService {
    private loggerPrefix = '[ConferenceService] -';

    private subscriptions: Subscription[] = [];
    constructor(router: Router, private activatedRoute: ActivatedRoute, private eventService: EventsService, private apiClient: ApiClient) {
        router.events
            .pipe(
                filter(x => x instanceof NavigationEnd),
                map(() => activatedRoute.snapshot),
                map(route => {
                    while (route && !route.paramMap?.has('conferenceId')) {
                        route = route?.firstChild;
                    }

                    return route?.paramMap;
                })
            )
            .subscribe(paramMap => {
                this.onRouteParamsChanged(paramMap);
            });
    }

    private _currentConference: ConferenceResponse;
    get currentConference(): ConferenceResponse {
        return this._currentConference;
    }

    private currentConferenceSubject: ReplaySubject<ConferenceResponse> = new ReplaySubject<ConferenceResponse>();
    get currentConference$(): Observable<ConferenceResponse> {
        return this.currentConferenceSubject.asObservable();
    }

    private onCurrentConferenceStatusChangedSubject: BehaviorSubject<ConferenceStatus> = new BehaviorSubject<ConferenceStatus>(
        this.currentConference?.status
    );
    get onCurrentConferenceStatusChanged$() {
        return this.onCurrentConferenceStatusChangedSubject.asObservable();
    }

    private _currentConferenceId: string;
    get currentConferenceId(): string {
        return this._currentConferenceId;
    }

    getConferenceById(conferenceId: string | Guid): Observable<ConferenceResponse> {
        console.log(`${this.loggerPrefix} getting conference by ID: ${conferenceId}`);

        return this.apiClient.getConferenceById(conferenceId.toString());
    }

    private onRouteParamsChanged(params: ParamMap): void {
        this._currentConferenceId = params?.get('conferenceId');

        console.log(`${this.loggerPrefix} New route - Conference ID: ${this._currentConferenceId}`, {
            routeParams: params
        });

        if (!this._currentConferenceId) {
            console.warn(`${this.loggerPrefix} Could not get conference id from the route parameters: ${params?.get('conferenceId')}`, {
                routeParams: params,
                route: this.activatedRoute
            });
            return;
        }

        console.log(`${this.loggerPrefix} attempting to get conference details.`);
        this.getConferenceById(this.currentConferenceId)
            .pipe(take(1))
            .subscribe(conference => {
                console.log(`${this.loggerPrefix} conference details retrieved.`, {
                    oldDetails: this.currentConference,
                    newDetails: conference
                });

                this._currentConference = conference;
                this.currentConferenceSubject.next(conference);

                this.setupConferenceSubscriptions();
            });
    }

    setupConferenceSubscriptions() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
        this.subscriptions = [];
        this.subscriptions.push(
            this.eventService
                .getHearingStatusMessage()
                .pipe(filter(conferenceStatusMessage => conferenceStatusMessage.conferenceId === this.currentConferenceId))
                .subscribe(hearingStatusMessage => this.handleConferenceStatusChange(hearingStatusMessage))
        );
    }

    private handleConferenceStatusChange(conferenceStatusMessage: ConferenceStatusMessage): void {
        if (this.currentConference.status !== conferenceStatusMessage.status) {
            console.log(`${this.loggerPrefix} updating conference status`, {
                oldValue: this.currentConference.status,
                newValue: conferenceStatusMessage.status
            });

            this.currentConference.status = conferenceStatusMessage.status;
            this.onCurrentConferenceStatusChangedSubject.next(this.currentConference.status);
        }
    }
}
