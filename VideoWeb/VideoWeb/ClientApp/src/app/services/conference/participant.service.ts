import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';
import { from, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { IHttpRequestResult, toHttpRequestResult } from 'src/app/shared/http-request-result/http-request-result';
import { Participant } from 'src/app/shared/models/participant';
import { ParticipantUpdated } from 'src/app/waiting-space/models/video-call-models';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { ApiClient, ParticipantForUserResponse } from '../clients/api-client';
import { Logger } from '../logging/logger-base';

@Injectable({
    providedIn: 'root'
})
export class ParticipantService {
    private _participants: Participant[] = [];
    public get participants() {
        return this._participants;
    }

    private _participantIdToPexipIdMap: { [participantId: string]: string } = {};
    public get participantIdToPexipIdMap() {
        return this._participantIdToPexipIdMap;
    }

    constructor(private apiClient: ApiClient, private videoCallService: VideoCallService, private logger: Logger) {
        this.initialise();
    }

    getParticipantsForConference(conferenceId: Guid | string): Observable<Participant[]> {
        return this.apiClient
            .getParticipantsByConferenceId(conferenceId.toString())
            .pipe(map(participants => participants.map(participantResponse => new Participant(participantResponse))));
    }

    getPexipIdForParticipant(participantId: Guid | string): string {
        const pexipId = this.participantIdToPexipIdMap[participantId.toString()];
        return pexipId ? pexipId : Guid.EMPTY;
    }

    private initialise() {
        this.getParticipantsForConference(Guid.EMPTY)
            .pipe(take(1))
            .subscribe(participants => {
                this._participants = participants;
            });

        this.videoCallService
            .onParticipantUpdated()
            .subscribe(updatedParticipant => this.handleParticipantUpdatedInVideoCall(updatedParticipant));
    }

    private handleParticipantUpdatedInVideoCall(updatedParticipant: ParticipantUpdated): void {
        const participant = this.participants.find(x => updatedParticipant.pexipDisplayName.includes(x.id));
        if (!participant) {
            this.logger.warn('Could not set pexip ID for participant as participant could not be found.');
            return;
        }

        this.setPexipIdForParticipant(updatedParticipant.uuid, participant.id);
    }

    private setPexipIdForParticipant(pexipId: string, participantId: string | Guid) {
        this._participantIdToPexipIdMap[participantId.toString()] = pexipId;
    }
}
