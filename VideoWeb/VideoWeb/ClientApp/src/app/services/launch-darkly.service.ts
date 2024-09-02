import { Injectable, OnDestroy } from '@angular/core';
import { LDFlagValue, LDClient, LDContext, initialize } from 'launchdarkly-js-client-sdk';
import { Observable, Subject } from 'rxjs';
import { ConfigService } from './api/config.service';
import { first, map } from 'rxjs/operators';

export const FEATURE_FLAGS = {
    dom1SignIn: 'dom1',
    wowzaKillButton: 'wowza-listener-kill-switch',
    vodafone: 'vodafone',
    activeSessionFilter: 'active-sessions-filter',
    interpreterEnhancements: 'interpreter-enhancements'
};

@Injectable({
    providedIn: 'root'
})
export class LaunchDarklyService implements OnDestroy {
    client: LDClient;

    constructor(private configService: ConfigService) {
        this.initialize();
    }

    async ngOnDestroy() {
        await this.client.close();
    }

    initialize(): void {
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
            });
    }

    getFlag<T>(flagKey: string, defaultValue: LDFlagValue = false): Observable<T> {
        const fetchFlag = new Subject<void>();
        this.client.on(`change:${flagKey}`, () => {
            fetchFlag.next();
        });
        this.client.waitUntilReady().then(() => {
            fetchFlag.next();
        });
        return fetchFlag.pipe(map(() => this.client.variation(flagKey, defaultValue) as T));
    }
}
