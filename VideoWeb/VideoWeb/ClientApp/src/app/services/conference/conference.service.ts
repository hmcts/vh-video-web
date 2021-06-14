import { Injectable } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Guid } from 'guid-typescript';
import { Observable, ReplaySubject } from 'rxjs';
import { ApiClient, ConferenceResponse } from '../clients/api-client';
import { Logger } from '../logging/logger-base';

@Injectable({
    providedIn: 'root'
})
export class ConferenceService {
    private loggerPrefix = '[ConferenceService] -';

    constructor(route: ActivatedRoute, private apiClient: ApiClient, private logger: Logger) {
        route.firstChild.paramMap.subscribe(params => this.onRouteParamsChanged(params));
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
        return this.apiClient.getConferenceById(conferenceId.toString());
    }

    private onRouteParamsChanged(params: ParamMap): void {
        this._currentConferenceId = params.get('conferenceId');
        this.logger.info(`${this.loggerPrefix} New route - Conference ID: ${this._currentConferenceId}`, {
            routeParams: params
        });

        if (!this._currentConferenceId) {
            this.logger.warn(`${this.loggerPrefix} Could not get conference id from the route parameters: ${params.get('conferenceId')}`, {
                routeParams: params
            });
            return;
        }

        this.getConferenceById(this.currentConferenceId).subscribe(conference => {
            this._currentConference = conference;
            this.currentConferenceSubject.next(conference);
        });
    }
}
