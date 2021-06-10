import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { Participant } from 'src/app/shared/models/participant';
import { VideoWebService } from '../api/video-web.service';
import { ParticipantResponse } from '../clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class ParticipantService {
    private _participants: Participant[];
    public get participants() {
        return this._participants;
    }

    constructor(private videoWebService: VideoWebService) {
        this.initialise();
    }

    private initialise() {
        this.getParticipants(Guid.EMPTY)
            .pipe(take(1))
            .subscribe(participants => {
                this._participants = participants;
            });
    }

    getParticipants(conferenceId: Guid | string): Observable<Participant[]> {
        throw new Error('Not Implemented');
    }

    getPexipIdForParticipant(participantId: Guid | string): string {
        throw new Error('Not Implemented');
    }
}
