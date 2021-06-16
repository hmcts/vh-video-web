import { Injectable } from '@angular/core';
import { ActivatedRoute, NavigationEnd, ParamMap, Router } from '@angular/router';
import { Guid } from 'guid-typescript';
import { Observable, ReplaySubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ApiClient, ConferenceResponse } from '../clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class ConferenceService {
    private loggerPrefix = '[ConferenceService] -';

    constructor(router: Router, private activatedRoute: ActivatedRoute, private apiClient: ApiClient) {
        router.events
            .pipe(
                filter(x => x instanceof NavigationEnd),
                map(() => activatedRoute.snapshot),
                map(route => {
                    while (route && !route.paramMap?.has('conferenceId')) {
                        route = route.firstChild;
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
        this.getConferenceById(this.currentConferenceId).subscribe(conference => {
            console.log(`${this.loggerPrefix} conference details retrieved.`, {
                oldDetails: this.currentConference,
                newDetails: conference
            });

            this._currentConference = conference;
            this.currentConferenceSubject.next(conference);
        });
    }
}
