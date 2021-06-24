import { Inject, Injectable, InjectionToken } from '@angular/core';
import { ConferenceService } from '../conference/conference.service';
import { LogAdapter } from './log-adapter';
import { Logger } from './logger-base';

export const LOG_ADAPTER = new InjectionToken<LogAdapter>('LogAdapter');

@Injectable({
    providedIn: 'root'
})
export class LoggerService implements Logger {
    static currentConferenceIdPropertyKey = 'currentConferenceId';

    private conferenceService: ConferenceService;
    constructor(@Inject(LOG_ADAPTER) private adapters: LogAdapter[]) {}

    debug(message: string, properties?: any): void {
        if (typeof properties === 'object') {
            properties = properties ?? {};
            properties[LoggerService.currentConferenceIdPropertyKey] = this.conferenceService?.currentConferenceId;
        }

        this.adapters.forEach(logger => logger.debug(message, properties));
    }

    info(message: string, properties?: any): void {
        if (typeof properties === 'object') {
            properties = properties ?? {};
            properties[LoggerService.currentConferenceIdPropertyKey] = this.conferenceService?.currentConferenceId;
        }

        this.adapters.forEach(logger => logger.info(message, properties));
    }

    warn(message: string, properties?: any): void {
        if (typeof properties === 'object') {
            properties = properties ?? {};
            properties[LoggerService.currentConferenceIdPropertyKey] = this.conferenceService?.currentConferenceId;
        }

        this.adapters.forEach(logger => logger.warn(message, properties));
    }

    error(message: string, err: Error, properties?: any) {
        if (typeof properties === 'object') {
            properties = properties ?? {};
            properties[LoggerService.currentConferenceIdPropertyKey] = this.conferenceService?.currentConferenceId;
        }
        this.adapters.forEach(logger => logger.trackException(message, err, properties));
    }

    event(event: string, properties?: any) {
        if (typeof properties === 'object') {
            properties = properties ?? {};
            properties[LoggerService.currentConferenceIdPropertyKey] = this.conferenceService?.currentConferenceId;
        }

        this.adapters.forEach(logger => logger.trackEvent(event, properties));
    }
}
