import { Injectable } from '@angular/core';

export interface IHearingControlsState {
    participantState: { [participantId: string]: IParticipantControlsState };
}

export interface IParticipantControlsState {
    isSpotlighted: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class VideoControlCacheService {
    hearingControlStates: { [conferenceId: string]: IHearingControlsState } = {};
    get localStorageKey() {
        return 'conferenceControlStates';
    }

    constructor() {
        this.initialise();
    }

    setSpotlightStatus(conferenceId: string, participantId: string, spotlightValue: boolean) {
        throw new Error('Not Implemented');
    }

    getSpotlightStatus(conferenceId: string, participantId: string): boolean {
        throw new Error('Not Implemented');
    }

    getStateForConference(conferenceId: string): IHearingControlsState {
        return this.hearingControlStates[conferenceId] ?? { participantState: {} };
    }

    private initialise() {
        this.loadFromLocalStorage();
    }

    loadFromLocalStorage(): { [conferenceId: string]: IHearingControlsState } {
        const hearingControlStatesJson = window.localStorage.getItem(this.localStorageKey);

        if (hearingControlStatesJson === undefined) return;

        this.hearingControlStates = JSON.parse(hearingControlStatesJson);

        return this.hearingControlStates;
    }

    private saveToLocalStorage() {
        window.localStorage.setItem(this.localStorageKey, JSON.stringify(this.hearingControlStates));
    }
}
