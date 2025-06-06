import { Inject, Injectable, InjectionToken } from '@angular/core';
import { LogAdapter } from './log-adapter';
import { Logger } from './logger-base';
import { environment } from 'src/environments/environment';
import { FEATURE_FLAGS, LaunchDarklyService } from '../launch-darkly.service';
import { ConferenceState } from 'src/app/waiting-space/store/reducers/conference.reducer';
import { Store } from '@ngrx/store';
import * as ConferenceSelectors from '../../waiting-space/store/selectors/conference.selectors';

export const LOG_ADAPTER = new InjectionToken<LogAdapter>('LogAdapter');

@Injectable({
    providedIn: 'root'
})
export class LoggerService implements Logger {
    static currentConferenceIdPropertyKey = 'currentConferenceId';
    currentConferenceId: string | null = null;
    enableDebugLogs: boolean;

    private higherLevelLogsOnly = false;

    constructor(
        @Inject(LOG_ADAPTER) private adapters: LogAdapter[],
        conferenceStore: Store<ConferenceState>,
        ldService: LaunchDarklyService
    ) {
        ldService.getFlag<boolean>(FEATURE_FLAGS.enableDebugLogs, false).subscribe(enableDebugLogs => {
            this.enableDebugLogs = enableDebugLogs;
        });
        conferenceStore.select(ConferenceSelectors.getActiveConference).subscribe(conference => {
            this.currentConferenceId = conference?.id ?? null;
        });
        this.higherLevelLogsOnly = environment.production;
    }
    addUserIdToLogger(userId: string) {
        this.adapters.forEach(logger => logger.addUserIdToLogger(userId));
    }

    addConferenceIdToProperties(properties?: any, conferenceIdKey: string = LoggerService.currentConferenceIdPropertyKey) {
        properties = properties ?? {};
        if (typeof properties === 'object') {
            properties[conferenceIdKey] = this.currentConferenceId ?? null;
        }

        return properties;
    }

    pexRtcInfo(message: string, properties?: any): void {
        this.adapters.forEach(logger =>
            logger.info(`[PexipApi] - Current Conference ID: ${this.currentConferenceId} - ${message}`, properties)
        );
    }

    debug(message: string, properties?: any): void {
        if (this.higherLevelLogsOnly && !this.enableDebugLogs) {
            return;
        }
        properties = this.addConferenceIdToProperties(properties);
        this.adapters.forEach(logger => {
            logger.debug(message, properties);
        });
    }

    info(message: string, properties?: any): void {
        properties = this.addConferenceIdToProperties(properties);
        this.adapters.forEach(logger => logger.info(message, properties));
    }

    warn(message: string, properties?: any): void {
        properties = this.addConferenceIdToProperties(properties);
        this.adapters.forEach(logger => logger.warn(message, properties));
    }

    error(message: string, err: Error, properties?: any) {
        properties = this.addConferenceIdToProperties(properties);
        this.adapters.forEach(logger => logger.trackException(message, err, properties));
    }

    event(event: string, properties?: any) {
        properties = this.addConferenceIdToProperties(properties);
        this.adapters.forEach(logger => logger.trackEvent(event, properties));
    }
}
