import { Injectable, OnDestroy } from '@angular/core';
import { LDFlagValue, LDClient, LDContext, initialize } from 'launchdarkly-js-client-sdk';
import { Observable, Subject } from 'rxjs';
import { ConfigService } from './api/config.service';
import { map } from 'rxjs/operators';

export const FEATURE_FLAGS = {
    vhoWorkAllocation: 'vho-work-allocation',
    ejudiciarySignIn: 'ejud-feature',
    dom1SignIn: 'dom1',
    multiIdpSelection: 'multi-idp-selection'
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
        console.log('Initializing LaunchDarkly');
        this.configService.getClientSettings().subscribe(config => {
            const ldClientId = config.launch_darkly_client_id;
            const envName = config.vh_idp_settings.redirect_uri;

            const context: LDContext = {
                kind: 'user',
                key: 'VideoWeb',
                name: envName
            };

            console.log('Initializing LaunchDarkly with settings');
            this.client = initialize(ldClientId, context);
        });
    }

    getFlag<T>(flagKey: string, defaultValue: LDFlagValue = false): Observable<T> {
        console.log(`Getting LaunchDarkly flag: ${flagKey}`);
        const fetchFlag = new Subject<void>();
        this.client.on(`change:${flagKey}`, () => {
            fetchFlag.next();
        });
        this.client.waitUntilReady().then(() => {
            fetchFlag.next();
        });
        return fetchFlag.pipe(
            map(() => {
                return this.client.variation(flagKey, defaultValue) as T;
            })
        );
    }
}
