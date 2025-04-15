import { Injectable } from '@angular/core';
import { Logger } from './logging/logger-base';

import NoSleepApp from 'no-sleep-app';

@Injectable({
    providedIn: 'root'
})
export class NoSleepServiceV2 {
    noSleep = new NoSleepApp();

    private loggerPrefix = '[NoSleepServiceV2] -';

    constructor(private logger: Logger) {}

    enable() {
        console.log(`${this.loggerPrefix} no sleep status: ${this.noSleep.isEnabled}`);
        if (!this.noSleep.isEnabled) {
            this.logger.debug(`${this.loggerPrefix} enabling no sleep`);
            this.noSleep.enable();
        }
    }

    disable() {
        this.noSleep.disable();
        this.logger.debug(`${this.loggerPrefix} disabled no sleep`);
    }
}
