import { Injectable } from '@angular/core';

export interface IHearingControlsState {
    participantState: { [participantId: string]: IParticipantControlsState };
}

export interface IParticipantControlsState {
    isSpotlighted: boolean;
}

export interface IHearingControlStates {
    [conferenceId: string]: IHearingControlsState;
}

@Injectable({
    providedIn: 'root'
})
export class VideoControlCacheService {
    hearingControlStates: IHearingControlStates = {};
    get localStorageKey() {
        return 'conferenceControlStates';
    }

    constructor() {
        this.initialise();
    }

    setSpotlightStatus(conferenceId: string, participantId: string, spotlightValue: boolean) {
        if (!this.hearingControlStates[conferenceId]) {
            this.hearingControlStates[conferenceId] = {
                participantState: {}
            };
        }

        if (!this.hearingControlStates[conferenceId].participantState[participantId]) {
            this.hearingControlStates[conferenceId].participantState[participantId] = {
                isSpotlighted: spotlightValue
            };
        } else {
            this.hearingControlStates[conferenceId].participantState[participantId].isSpotlighted = spotlightValue;
        }

        this.saveToLocalStorage();
    }

    getSpotlightStatus(conferenceId: string, participantId: string): boolean {
        return this.hearingControlStates[conferenceId]?.participantState[participantId]?.isSpotlighted ?? false;
    }

    getStateForConference(conferenceId: string): IHearingControlsState {
        return this.hearingControlStates[conferenceId] ?? { participantState: {} };
    }

    private initialise() {
        this.loadFromLocalStorage();
    }

    private loadFromLocalStorage(): IHearingControlStates {
        const hearingControlStatesJson = window.localStorage.getItem(this.localStorageKey);

        if (!hearingControlStatesJson) return null;

        this.hearingControlStates = JSON.parse(hearingControlStatesJson);

        return this.hearingControlStates;
    }

    private saveToLocalStorage() {
        window.localStorage.setItem(this.localStorageKey, JSON.stringify(this.hearingControlStates));
    }
}
