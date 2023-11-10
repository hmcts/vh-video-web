import { Injectable } from '@angular/core';
import { LoggerService } from '../logging/logger.service';

@Injectable({
    providedIn: 'root'
})
export class LocalStorageService {
    private loggerPrefix = '[LocalStorageService] -';
    constructor(private logger: LoggerService) {}

    save(key: string, value: string | object, overwrite: boolean = true): boolean {
        this.logger.debug(`${this.loggerPrefix} Saving to local storage.`, {
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

        if (typeof value !== 'string') {
            value = JSON.stringify(value);
        }

        window.localStorage.setItem(key, value);
        return true;
    }

    load<T>(key: string): T {
        const valueJson = window.localStorage.getItem(key);

        if (!valueJson) {
            return undefined;
        }

        return JSON.parse(valueJson) as T;
    }
}
