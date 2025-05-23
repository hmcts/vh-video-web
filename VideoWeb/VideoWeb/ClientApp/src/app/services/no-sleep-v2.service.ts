import { Injectable } from '@angular/core';
import { Logger } from './logging/logger-base';

import NoSleepApp from 'no-sleep-app';

@Injectable({
    providedIn: 'root'
})
export class NoSleepServiceV2 {
    noSleep = new NoSleepApp();

    private readonly loggerPrefix = '[NoSleepServiceV2] -';

    constructor(private logger: Logger) {}

    enable() {
        this.enableOnEvent('click');
        this.enableOnEvent('touchstart');
    }

    startSleepPreventer() {
        if (!this.noSleep.isEnabled) {
            this.logger.debug(`${this.loggerPrefix} enabling no sleep`);
            this.noSleep.enable(); // keep the screen on!
        } else {
            this.logger.debug(`${this.loggerPrefix} no sleep is already enabled`);
        }
    }

    disable() {
        this.noSleep.disable();
        this.logger.debug(`${this.loggerPrefix} disabled no sleep`);
    }

    private enableOnEvent(eventType: string) {
        const handler = () => {
            this.startSleepPreventer();
            window.removeEventListener(eventType, handler);
        };
        window.addEventListener(eventType, handler);
        this.logger.debug(`${this.loggerPrefix} will enable no sleep on '${eventType}' event`);
    }
}
