import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';
import { from, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { IHttpRequestResult, toHttpRequestResult } from 'src/app/shared/http-request-result/http-request-result';
import { Participant } from 'src/app/shared/models/participant';
import { ApiClient, ParticipantForUserResponse } from '../clients/api-client';
import { Logger } from '../logging/logger-base';

@Injectable({
    providedIn: 'root'
})
export class ParticipantService {
    private _participants: Participant[];
    public get participants() {
        return this._participants;
    }

    private participantIdToPexipIdMap: [{ string: string }];

    constructor(private apiClient: ApiClient, private logger: Logger) {
        this.initialise();
    }

    private initialise() {
        this.getParticipantsForConference(Guid.EMPTY)
            .pipe(take(1))
            .subscribe(participants => {
                this._participants = participants;
            });
    }

    getParticipantsForConference(conferenceId: Guid | string): Observable<Participant[]> {
        return this.apiClient
            .getParticipantsByConferenceId(conferenceId.toString())
            .pipe(map(participants => participants.map(participantResponse => new Participant(participantResponse))));
    }

    getPexipIdForParticipant(participantId: Guid | string): string {
        throw new Error('Not Implemented');
    }
}
