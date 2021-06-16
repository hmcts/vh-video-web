import { Injectable } from '@angular/core';
import { LoggerService } from '../logging/logger.service';

export interface IHearingControlsState {
    participantStates: { [participantId: string]: IParticipantControlsState };
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
    private loggerPrefix = '[VideoControlCacheService] -';

    hearingControlStates: IHearingControlStates = {};
    get localStorageKey() {
        return 'conferenceControlStates';
    }

    constructor(private logger: LoggerService) {
        this.initialise();
    }

    setSpotlightStatus(conferenceId: string, participantId: string, spotlightValue: boolean) {
        this.logger.info(`${this.loggerPrefix} Setting spotlight status.`, {
            conferenceId: conferenceId,
            participantId: participantId,
            oldValue: this.hearingControlStates[conferenceId]?.participantStates[participantId]?.isSpotlighted,
            newValue: spotlightValue
        });

        if (!this.hearingControlStates[conferenceId]) {
            this.hearingControlStates[conferenceId] = {
                participantStates: {}
            };
        }

        if (!this.hearingControlStates[conferenceId].participantStates[participantId]) {
            this.hearingControlStates[conferenceId].participantStates[participantId] = {
                isSpotlighted: spotlightValue
            };
        } else {
            this.hearingControlStates[conferenceId].participantStates[participantId].isSpotlighted = spotlightValue;
        }

        this.saveToLocalStorage();
    }

    getSpotlightStatus(conferenceId: string, participantId: string): boolean {
        return this.hearingControlStates[conferenceId]?.participantStates[participantId]?.isSpotlighted ?? false;
    }

    getStateForConference(conferenceId: string): IHearingControlsState {
        return this.hearingControlStates[conferenceId] ?? { participantStates: {} };
    }

    private initialise() {
        this.loadFromLocalStorage();
    }

    private loadFromLocalStorage(): IHearingControlStates {
        this.logger.info(`${this.loggerPrefix} Loading video control states from local storage.`, {
            localStorageKey: this.localStorageKey
        });

        const hearingControlStatesJson = window.localStorage.getItem(this.localStorageKey);

        if (!hearingControlStatesJson) {
            this.logger.warn(`${this.loggerPrefix} Failed to load hearing control states from local storage.`, {
                localStorageKey: this.localStorageKey
            });

            return null;
        }

        this.hearingControlStates = JSON.parse(hearingControlStatesJson);

        this.logger.info(`${this.loggerPrefix} Loaded video control states from local storage.`, {
            localStorageKey: this.localStorageKey,
            hearingControlStates: this.hearingControlStates
        });

        return this.hearingControlStates;
    }

    private saveToLocalStorage() {
        this.logger.info(`${this.loggerPrefix} Saving video control states to local storage.`, {
            localStorageKey: this.localStorageKey,
            hearingControlStates: this.hearingControlStates
        });

        window.localStorage.setItem(this.localStorageKey, JSON.stringify(this.hearingControlStates));
    }
}
