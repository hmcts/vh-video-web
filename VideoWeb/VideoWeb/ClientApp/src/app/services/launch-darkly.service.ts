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

// @Injectable({
//     providedIn: 'root'
// })
// export class LaunchDarklyService {
//     private flags: any;
//     ldClient: LDClient.LDClient;
//     _flagChange = new Subject();
//     // flagChange = new Subject();

//     constructor(private configService: ConfigService, private logger: Logger) {
//         this.initialize();
//         // this.ldClient.waitUntilReady().then(() => {
//         //     this.onReady();

//         //     this.onChange();
//         // });
//     }

//     get flagChange() {
//         return of(this.ldClient.waitUntilReady()).pipe(
//             switchMap(() => {
//                 this.onReady();
//                 this.onChange();
//                 return this._flagChange;
//             })
//         );
//     }

//     initialize(): void {
//         this.flags = {};
//         const ldClientId = this.configService.getConfig().launch_darkly_client_id;
//         const envName = this.configService.getConfig().vh_idp_settings.redirect_uri;

//         const context: LDClient.LDContext = {
//             kind: 'user',
//             key: 'VideoWeb',
//             name: envName
//         };

//         this.ldClient = LDClient.initialize(ldClientId, context);
//     }

//     onReady(): void {
//         this.ldClient.on('ready', flags => {
//             this.setAllFlags();
//         });
//     }

//     onChange(): void {
//         this.ldClient.on('change', flags => {
//             for (const flag of Object.keys(flags)) {
//                 this.flags[flag] = flags[flag].current;
//             }
//             this._flagChange.next(this.flags);
//             this.logger.info('Flags updated', this.flags);
//         });
//     }

//     private setAllFlags(): void {
//         this.flags = this.ldClient.allFlags();
//         this._flagChange.next(this.flags);
//         this.logger.info('Flags initialized');
//     }
// }
