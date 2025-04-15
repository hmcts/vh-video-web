import { Injectable, OnDestroy } from '@angular/core';
import { LDFlagValue, LDClient, LDContext, initialize } from 'launchdarkly-js-client-sdk';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { ConfigService } from './api/config.service';
import { first, map, switchMap } from 'rxjs/operators';

export const FEATURE_FLAGS = {
    dom1SignIn: 'dom1',
    wowzaKillButton: 'wowza-listener-kill-switch',
    activeSessionFilter: 'active-sessions-filter',
    interpreterEnhancements: 'interpreter-enhancements',
    dialOutParticipant: 'dial-out-participant',
    instantMessaging: 'instant-messaging',
    enableDebugLogs: 'enable-debug-logs',
    uniqueCallTags: 'unique-call-tag',
    pexipV36: 'pexip-v36'
};

@Injectable({
    providedIn: 'root'
})
export class LaunchDarklyService implements OnDestroy {
    client: LDClient;
    private flagSubjects: { [key: string]: BehaviorSubject<LDFlagValue> } = {};
    private readonly flagsReadySubject = new ReplaySubject<boolean>(1);

    constructor(private configService: ConfigService) {
        this.vhInitialize();
    }

    async ngOnDestroy() {
        await this.client.close();
    }

    vhInitialize(): void {
        this.configService
            .getClientSettings()
            .pipe(first())
            .subscribe(config => {
                const ldClientId = config.launch_darkly_client_id;
                const envName = config.vh_idp_settings.redirect_uri;

                const context: LDContext = {
                    kind: 'user',
                    key: 'VideoWeb',
                    name: envName
                };

                this.client = initialize(ldClientId, context);
                this.client.waitUntilReady().then(() => {
                    this.loadAllFlagsAndSetupSubscriptions();
                });
            });
    }

    loadAllFlagsAndSetupSubscriptions(): void {
        const allFlags = this.client.allFlags();
        Object.values(FEATURE_FLAGS).forEach(flagKey => {
            this.flagSubjects[flagKey] = new BehaviorSubject<LDFlagValue>(allFlags[flagKey]);
            this.client.on(`change:${flagKey}`, (newValue: LDFlagValue) => {
                this.flagSubjects[flagKey].next(newValue);
            });
        });
        this.flagsReadySubject.next(true);
        this.flagsReadySubject.complete();
    }

    getFlag<T>(flagKey: string, defaultValue: LDFlagValue = false): Observable<T> {
        return this.flagsReadySubject.asObservable().pipe(
            switchMap(() => {
                if (!this.flagSubjects[flagKey]) {
                    this.flagSubjects[flagKey] = new BehaviorSubject<LDFlagValue>(defaultValue);
                }
                return this.flagSubjects[flagKey].asObservable().pipe(map(value => value as T));
            })
        );
    }
}
