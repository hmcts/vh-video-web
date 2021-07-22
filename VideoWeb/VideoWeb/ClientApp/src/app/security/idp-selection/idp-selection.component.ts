import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from '../../shared/page-url.constants';
import { SecurityConfigSetupService } from '../security-config-setup.service';
import { IdpProviders } from '../security-providers';

@Component({
    selector: 'app-idp-selection',
    templateUrl: './idp-selection.component.html'
})
export class IdpSelectionComponent {
    identityProviders = {};

    selectedProvider: IdpProviders;
    submitted = false;

    constructor(private router: Router, private logger: Logger, private securityConfigSetupService: SecurityConfigSetupService) {
        this.identityProviders[IdpProviders.ejud] = {
            url: '/' + pageUrls.Login
        };

        this.identityProviders[IdpProviders.vhaad] = {
            url: '/' + pageUrls.Login
        };
    }

    showError(): boolean {
        return this.submitted && !this.selectedProvider;
    }

    getProviders(): string[] {
        return Object.keys(this.identityProviders);
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
