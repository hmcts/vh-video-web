import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';
import { from, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Participant } from 'src/app/shared/models/participant';
import { VideoWebService } from '../api/video-web.service';
import { ConferenceResponse, ParticipantResponse, ParticipantResponseVho } from '../clients/api-client';

@Injectable({
    providedIn: 'root'
})
export class ParticipantService {
    private _participants: Participant[];
    public get participants() {
        return this._participants;
    }

    private participantIdToPexipIdMap: [{ string: string }];

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
        return from(this.videoWebService.getParticipantsByConferenceId(conferenceId.toString())).pipe(
            map(participants => participants.map(participantResponse => new Participant(participantResponse)))
        );
    }

    getPexipIdForParticipant(participantId: Guid | string): string {
        throw new Error('Not Implemented');
    }
}
