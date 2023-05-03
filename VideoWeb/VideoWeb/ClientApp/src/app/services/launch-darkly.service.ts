import { Injectable, OnDestroy } from '@angular/core';
// import * as LDClient from 'launchdarkly-js-client-sdk';
import { LDFlagValue, LDClient, LDContext, initialize } from 'launchdarkly-js-client-sdk';
import { Observable, Subject, of } from 'rxjs';
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

    get flagChange() {
        return of(this.client.waitUntilReady()).pipe(
            map(() => {
                const allFlags = this.client.allFlags();
                return allFlags;
            })
        );
    }

    initialize(): void {
        const ldClientId = this.configService.getConfig().launch_darkly_client_id;
        const envName = this.configService.getConfig().vh_idp_settings.redirect_uri;

        const context: LDContext = {
            kind: 'user',
            key: 'VideoWeb',
            name: envName
        };

        this.client = initialize(ldClientId, context);
    }

    getFlag(flagKey: string, defaultValue: LDFlagValue = false): Observable<LDFlagValue> {
        const fetchFlag = new Subject<void>();
        this.client.on(`change:${flagKey}`, () => {
            fetchFlag.next();
        });
        this.client.waitUntilReady().then(() => {
            fetchFlag.next();
        });
        return fetchFlag.pipe(
            map(() => {
                return this.client.variation(flagKey, defaultValue);
            })
        );
    }
}
