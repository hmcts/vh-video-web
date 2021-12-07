import { Inject, Injectable, InjectionToken } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, ParamMap, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { activatedRoute } from 'src/app/waiting-space/waiting-room-shared/tests/waiting-room-base-setup';
import { LogAdapter } from './log-adapter';
import { Logger } from './logger-base';

export const LOG_ADAPTER = new InjectionToken<LogAdapter>('LogAdapter');

@Injectable({
    providedIn: 'root'
})
export class LoggerService implements Logger {
    static currentConferenceIdPropertyKey = 'currentConferenceId';
    private currentConferenceId: string | null;

    constructor(@Inject(LOG_ADAPTER) private adapters: LogAdapter[], router: Router) {
        router.events
            .pipe(
                filter(x => x instanceof NavigationEnd),
                map(() => activatedRoute.snapshot),
                map(paramMap => this.getConferenceIdFromRoute(paramMap))
            )
            .subscribe(params => {
                this.currentConferenceId = params?.get('conferenceId') ?? null;
            });
    }

    private getConferenceIdFromRoute(route: ActivatedRouteSnapshot): ParamMap {
        while (route && !route.paramMap?.has('conferenceId')) {
            route = route?.firstChild;
        }

        return route?.paramMap;
    }

    addConferenceIdToProperties(properties?: any, conferenceIdKey: string = LoggerService.currentConferenceIdPropertyKey) {
        properties = { properties } ?? {};
        if (typeof properties === 'object') {
            properties[conferenceIdKey] = this.currentConferenceId ?? null;
        }

        return properties;
    }

    debug(message: string, properties?: any): void {
        properties = this.addConferenceIdToProperties(properties);
        this.adapters.forEach(logger => logger.debug(message, properties));
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

    pexRtcMessage(message: string, properties?: any) {
        this.adapters.forEach(logger =>
            logger.info(`[PexipAPI] - Current Conference ID: ${this.currentConferenceId} - ${message}`, properties)
        );
    }
}
