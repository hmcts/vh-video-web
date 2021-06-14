import { Injectable } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Guid } from 'guid-typescript';
import { Observable, ReplaySubject } from 'rxjs';
import { ApiClient, ConferenceResponse } from '../clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class ConferenceService {
    constructor(route: ActivatedRoute, private apiClient: ApiClient) {
        route.paramMap.subscribe(params => this.onRouteParamsChanged(params));
    }

    private _currentConference: ConferenceResponse;
    get currentConference(): ConferenceResponse {
        return this._currentConference;
    }

    private currentConferenceSubject: ReplaySubject<ConferenceResponse>;
    get currentConference$(): Observable<ConferenceResponse> {
        return this.currentConferenceSubject.asObservable();
    }

    private _currentConferenceId: string;
    get currentConferenceId(): string {
        throw new Error('Not implemented');
    }

    getConferenceById(conferenceId: string | Guid) {
        throw Error('Not implemented');
    }

    private onRouteParamsChanged(params: ParamMap): void {
        this._currentConferenceId = params.get('conferenceId');
        this.apiClient.getConferenceById(this._currentConferenceId).subscribe(conference => {
            this._currentConference = conference;
            this.currentConferenceSubject.next(conference);
        });
    }
}
