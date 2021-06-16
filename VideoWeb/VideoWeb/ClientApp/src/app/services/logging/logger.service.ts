import { Inject, Injectable, InjectionToken } from '@angular/core';
import { ConferenceService } from '../conference/conference.service';
import { LogAdapter } from './log-adapter';
import { Logger } from './logger-base';

export const LOG_ADAPTER = new InjectionToken<LogAdapter>('LogAdapter');

@Injectable({
    providedIn: 'root'
})
export class LoggerService implements Logger {
    constructor(private conferenceService: ConferenceService, @Inject(LOG_ADAPTER) private adapters: LogAdapter[]) {}

    debug(message: string, properties?: any): void {
        properties = properties ?? {};
        properties['conferenceId'] = this.conferenceService.currentConferenceId;
        this.adapters.forEach(logger => logger.debug(message, properties));
    }

    info(message: string, properties?: any): void {
        properties = properties ?? {};
        properties['conferenceId'] = this.conferenceService.currentConferenceId;
        this.adapters.forEach(logger => logger.info(message, properties));
    }

    warn(message: string, properties?: any): void {
        properties = properties ?? {};
        properties['conferenceId'] = this.conferenceService.currentConferenceId;
        this.adapters.forEach(logger => logger.warn(message, properties));
    }

    error(message: string, err: Error, properties?: any) {
        properties = properties ?? {};
        properties['conferenceId'] = this.conferenceService.currentConferenceId;
        this.adapters.forEach(logger => logger.trackException(message, err, properties));
    }

    event(event: string, properties?: any) {
        properties = properties ?? {};
        properties['conferenceId'] = this.conferenceService.currentConferenceId;

        this.adapters.forEach(logger => logger.trackEvent(event, properties));
    }
}
