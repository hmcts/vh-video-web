import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from '../../shared/page-url.constants';
import { SecurityConfigSetupService } from '../security-config-setup.service';
import { IdpProviders } from '../idp-providers';
import { LaunchDarklyService, FEATURE_FLAGS } from 'src/app/services/launch-darkly.service';

@Component({
    selector: 'app-idp-selection',
    templateUrl: './idp-selection.component.html'
})
export class IdpSelectionComponent {
    identityProviders = {};
    identityProvidernames = [];

    selectedProvider: IdpProviders;
    submitted = false;

    constructor(
        private router: Router,
        private logger: Logger,
        private securityConfigSetupService: SecurityConfigSetupService,
        private ldService: LaunchDarklyService
    ) {
        this.ldService.getFlag<boolean>(FEATURE_FLAGS.ejudiciarySignIn).subscribe(value => {
            if (value) {
                this.identityProviders[IdpProviders.ejud] = {
                    url: '/' + pageUrls.Login
                };
            }
            if (value && value[FEATURE_FLAGS.dom1SignIn]) {
                this.identityProviders[IdpProviders.dom1] = {
                    url: '/' + pageUrls.Login
                };
            }
            this.updateProviderNames();
        });

        this.identityProviders[IdpProviders.vhaad] = {
            url: '/' + pageUrls.Login
        };
        this.updateProviderNames();
    }

    showError(): boolean {
        return this.submitted && !this.selectedProvider;
    }

    updateProviderNames(): void {
        this.identityProvidernames = Object.keys(this.identityProviders).reverse();
        // return Object.keys(this.identityProviders).reverse();
    }

    getProviders(): string[] {
        this.identityProvidernames = Object.keys(this.identityProviders).reverse();
        return Object.keys(this.identityProviders).reverse();
    }

    selectProvider(provider: IdpProviders) {
        this.selectedProvider = provider;
    }

    onSubmit(): boolean {
        this.submitted = true;
        return this.redirectToLogin(this.selectedProvider);
    }

    redirectToLogin(provider: IdpProviders): boolean {
        if (!this.identityProviders[provider]) {
            return false;
        }

        this.logger.info(`Sending to idp: ${provider}`);
        this.securityConfigSetupService.setIdp(provider);
        this.router.navigate([this.identityProviders[provider].url]);
        return true;
    }
}
