import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Observable } from 'rxjs';
import { IConferenceParticipantsStatus } from '../models/conference-participants-status';

const INITIAL_STATE: IConferenceParticipantsStatus = {};

@Injectable({
    providedIn: 'root'
})
export class ParticipantRemoteMuteStoreService extends ComponentStore<IConferenceParticipantsStatus> {
    assignPexipId(participantOrVmrId: string, pexipId: string) {
        this.patchState(state => {
            const newState = { ...state };
            newState[participantOrVmrId] = { ...newState[participantOrVmrId] };
            newState[participantOrVmrId].pexipId = pexipId;

            return newState;
        });
    }
    constructor() {
        super(INITIAL_STATE);
    }

    updateRemoteMuteStatus(participantOrVmrId: string, isRemoteMuted: boolean) {
        this.patchState(state => {
            const newState = { ...state };
            newState[participantOrVmrId] = { ...newState[participantOrVmrId] };
            newState[participantOrVmrId].isRemoteMuted = isRemoteMuted;

            return newState;
        });
    }

    updateLocalMuteStatus(participantOrVmrId: string, isLocalAudioMuted: boolean, isLocalVideoMuted: boolean) {
        this.patchState(state => {
            const newState = { ...state };
            newState[participantOrVmrId] = { ...newState[participantOrVmrId] };
            newState[participantOrVmrId].isLocalAudioMuted = isLocalAudioMuted;
            newState[participantOrVmrId].isLocalVideoMuted = isLocalVideoMuted;

            return newState;
        });
    }

    updateLocalMuteStatus(participantOrVmrId: string, isLocalAudioMuted: boolean, isLocalVideoMuted: boolean) {
        const state = {};
        state[participantOrVmrId] = {
            isLocalAudioMuted: isLocalAudioMuted,
            isLocalVideoMuted: isLocalVideoMuted
        } as IParticipatRemoteMuteStatus;

        this.patchState(state);
    }

    get conferenceParticipantsStatus$(): Observable<IConferenceParticipantsStatus> {
        return this.state$;
    }
}
