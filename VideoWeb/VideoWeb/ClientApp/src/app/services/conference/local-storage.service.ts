import { Injectable } from '@angular/core';
import { LoggerService } from '../logging/logger.service';

@Injectable({
    providedIn: 'root'
})
export class LocalStorageService {
    private loggerPrefix = '[LocalStorageService] -';
    constructor(private logger: LoggerService) {}

    save<T extends object>(key: string, value: T, overwrite: boolean = true): boolean {
        this.logger.info(`${this.loggerPrefix} Saving to local storage.`, {
            localStorageKey: key,
            value: value,
            canOverwrite: overwrite
        });

        if (window.localStorage.getItem(key) && !overwrite) {
            this.logger.warn(
                `${this.loggerPrefix} Cannot update value. An entry with that key already exists in local storage and overwrite was set to false.`,
                {
                    key: key,
                    value: value,
                    canOverwrite: overwrite
                }
            );

            return false;
        }

        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
    }

    load<T extends object>(key: string): T {
        const valueJson = window.localStorage.getItem(key);

        if (!valueJson) {
            return undefined;
        }

        return JSON.parse(valueJson) as T;
    }
}

/*
        this.logger.info(`${this.loggerPrefix} Loading from local storage.`, {
            localStorageKey: key
        });

        const valueJson = window.localStorage.getItem(key);

        if (!valueJson) {
            this.logger.warn(`${this.loggerPrefix} Failed to load from local storage.`, {
                localStorageKey: key
            });

            return null;
        }

        const value = JSON.parse(valueJson) as T;

        this.logger.info(`${this.loggerPrefix} Loaded from local storage.`, {
            localStorageKey: key,
            value: value
        });

        return value;
        */

// private loadFromLocalStorage(): IHearingControlStates {
//     this.logger.info(`${this.loggerPrefix} Loading video control states from local storage.`, {
//         localStorageKey: this.localStorageKey
//     });

//     const hearingControlStatesJson = window.localStorage.getItem(this.localStorageKey);

//     if (!hearingControlStatesJson) {
//         this.logger.warn(`${this.loggerPrefix} Failed to load hearing control states from local storage.`, {
//             localStorageKey: this.localStorageKey
//         });

//         return null;
//     }

//     this.hearingControlStates = JSON.parse(hearingControlStatesJson);

//     this.logger.info(`${this.loggerPrefix} Loaded video control states from local storage.`, {
//         localStorageKey: this.localStorageKey,
//         hearingControlStates: this.hearingControlStates
//     });

//     return this.hearingControlStates;
// }

// private saveToLocalStorage() {
//     this.logger.info(`${this.loggerPrefix} Saving video control states to local storage.`, {
//         localStorageKey: this.localStorageKey,
//         hearingControlStates: this.hearingControlStates
//     });

//     window.localStorage.setItem(this.localStorageKey, JSON.stringify(this.hearingControlStates));
// }
