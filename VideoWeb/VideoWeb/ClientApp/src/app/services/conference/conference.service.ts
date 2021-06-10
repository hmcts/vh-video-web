import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';
import { ConferenceResponse } from '../clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class ConferenceService {
    constructor() {}

    private _currentConference: ConferenceResponse;
    get currentConference(): ConferenceResponse {
        return this._currentConference;
    }

    getConferenceById(conferenceId: string | Guid) {
        throw Error('Not implemented');
    }
}
