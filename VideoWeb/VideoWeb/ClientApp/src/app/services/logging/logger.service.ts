import { Inject, Injectable, InjectionToken } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, ParamMap, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { LogAdapter } from './log-adapter';
import { Logger } from './logger-base';
import { environment } from 'src/environments/environment';

export const LOG_ADAPTER = new InjectionToken<LogAdapter>('LogAdapter');

@Injectable({
    providedIn: 'root'
})
export class LoggerService implements Logger {
    static currentConferenceIdPropertyKey = 'currentConferenceId';
    currentConferenceId: string | null = null;
    private higherLevelLogsOnly = false;
    constructor(@Inject(LOG_ADAPTER) private adapters: LogAdapter[], router: Router, activatedRoute: ActivatedRoute) {
        router.events
            .pipe(
                filter(x => x instanceof NavigationEnd),
                map(() => activatedRoute.snapshot),
                map(this.getConferenceIdFromRoute)
            )
            .subscribe(paramMap => {
                this.currentConferenceId = paramMap?.get('conferenceId') ?? null;
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
        if (this.higherLevelLogsOnly) {
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

    private getConferenceIdFromRoute(route: ActivatedRouteSnapshot): ParamMap {
        while (route && !route.paramMap?.has('conferenceId')) {
            route = route?.firstChild;
        }

        return route?.paramMap;
    }
}
