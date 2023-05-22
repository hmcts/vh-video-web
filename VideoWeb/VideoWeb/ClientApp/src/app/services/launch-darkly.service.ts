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
        const ldClientId = this.configService.getConfig().launch_darkly_client_id;
        const envName = this.configService.getConfig().vh_idp_settings.redirect_uri;

        const context: LDContext = {
            kind: 'user',
            key: 'VideoWeb',
            name: envName
        };

        this.client = initialize(ldClientId, context);
    }

    getFlag<T>(flagKey: string, defaultValue: LDFlagValue = false): Observable<T> {
        const fetchFlag = new Subject<void>();
        this.client.on(`change:${flagKey}`, () => {
            fetchFlag.next();
        });
        this.client.waitUntilReady().then(() => {
            fetchFlag.next();
        });
        return fetchFlag.pipe(
            map(() => {
                let flag = this.client.variation(flagKey, defaultValue);
                switch (flagKey) {
                    case FEATURE_FLAGS.multiIdpSelection:
                        flag = true;
                        break;
                    case FEATURE_FLAGS.dom1SignIn:
                        flag = true;
                        break;
                    default:
                        break;
                }
                return flag as T;
            })
        );
    }
}
