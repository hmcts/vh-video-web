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
        this.hearingControlStates = JSON.parse(window.localStorage.getItem(this.localStorageKey)) as {
            [conferenceId: string]: IHearingControlsState;
        };
    }

    setSpotlightStatus(conferenceId: string, participantId: string, spotlightValue: boolean) {
        throw new Error('Not Implemented');
    }

    getSpotlightStatus(conferenceId: string, participantId: string): boolean {
        throw new Error('Not Implemented');
    }

    getStateForConference(conferenceId: string): IHearingControlsState {
        throw new Error('Not Implemented');
    }
}
