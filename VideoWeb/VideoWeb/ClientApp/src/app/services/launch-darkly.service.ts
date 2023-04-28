import { Injectable } from '@angular/core';
import * as LDClient from 'launchdarkly-js-client-sdk';
import { Subject } from 'rxjs';
import { ConfigService } from './api/config.service';
import { Logger } from 'src/app/services/logging/logger-base';

export const FEATURE_FLAGS = {
    vhoWorkAllocation: 'vho-work-allocation',
    ejudiciarySignIn: 'ejud-feature',
    dom1SignIn: 'dom1',
    multiIdpSelection: 'multi-idp-selection'
};

@Injectable({
    providedIn: 'root'
})
export class LaunchDarklyService {
    private flags: any;
    ldClient: LDClient.LDClient;
    flagChange = new Subject();

    constructor(private configService: ConfigService, private logger: Logger) {
        this.initialize();

        this.onReady();

        this.onChange();
    }

    initialize(): void {
        this.flags = {};
        const ldClientId = this.configService.getConfig().launch_darkly_client_id;
        const envName = this.configService.getConfig().vh_idp_settings.redirect_uri;

        const context: LDClient.LDContext = {
            kind: 'user',
            key: 'VideoWeb',
            name: envName
        };

        this.ldClient = LDClient.initialize(ldClientId, context);
    }

    onReady(): void {
        this.ldClient.on('ready', flags => {
            this.setAllFlags();
        });
    }

    onChange(): void {
        this.ldClient.on('change', flags => {
            for (const flag of Object.keys(flags)) {
                this.flags[flag] = flags[flag].current;
            }
            this.flagChange.next(this.flags);
            this.logger.info('Flags updated', this.flags);
        });
    }

    private setAllFlags(): void {
        this.flags = this.ldClient.allFlags();
        this.flagChange.next(this.flags);
        this.logger.info('Flags initialized');
    }
}
