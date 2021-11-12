import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Observable } from 'rxjs';
import { IConferenceParticipantsStatus, IParticipatRemoteMuteStatus } from '../models/conference-participants-status';

const INITIAL_STATE: IConferenceParticipantsStatus = {};

@Injectable({
    providedIn: 'root'
})
export class ParticipantRemoteMuteStoreService extends ComponentStore<IConferenceParticipantsStatus> {
    constructor() {
        super(INITIAL_STATE);
    }

    updateRemoteMuteStatus(participantOrVmrId: string, isRemoteMuted: boolean) {
        const state = {};
        state[participantOrVmrId] = { isRemoteMuted: isRemoteMuted } as IParticipatRemoteMuteStatus;

        this.patchState(state);
    }

    get conferenceParticipantsStatus$(): Observable<IConferenceParticipantsStatus> {
        return this.state$;
    }
}
