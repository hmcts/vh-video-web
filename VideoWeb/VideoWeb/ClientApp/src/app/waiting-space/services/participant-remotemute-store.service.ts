import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { IConferenceParticipantsStatus } from '../models/conference-participants-status';

const INITIAL_STATE: IConferenceParticipantsStatus = {};
@Injectable({
    providedIn: 'root'
})
export class ParticipantRemotemuteStoreService extends ComponentStore<IConferenceParticipantsStatus> {

    constructor() {
        super(INITIAL_STATE)
    }
}
