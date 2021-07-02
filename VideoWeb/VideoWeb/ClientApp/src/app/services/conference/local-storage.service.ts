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
