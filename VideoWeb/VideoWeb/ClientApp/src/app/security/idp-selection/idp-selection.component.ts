import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from '../../shared/page-url.constants';
import { OidcConfigSetupService } from '../oidc-config-setup.service';

@Component({
    selector: 'app-idp-selection',
    templateUrl: './idp-selection.component.html'
})
export class IdpSelectionComponent implements OnInit {
    identityProviders = {
        ejud: {
            url: '/' + pageUrls.Login
        },
        vhaad: {
            url: '/' + pageUrls.Login
        }
    };

    selectedProvider: string;
    submitted = false;

    constructor(private router: Router, private logger: Logger, private oidcConfigSetupService: OidcConfigSetupService) { }

    ngOnInit() {
        debugger;
        const urlExtension = this.router.url;
        if (urlExtension) {
            this.selectProvider(urlExtension);
            this.redirectToLogin(this.selectedProvider);
        }
    }

    showError(): boolean {
        return this.submitted && !this.selectedProvider;
    }

    getProviders(): string[] {
        return Object.keys(this.identityProviders);
    }

    selectProvider(provider: string) {
        this.selectedProvider = provider;
    }

    onSubmit(): boolean {
        this.submitted = true;
        return this.redirectToLogin(this.selectedProvider);
    }

    redirectToLogin(provider: string): boolean {
        if (!this.identityProviders[provider]) {
            return false;
        }

        this.logger.info(`Sending to idp: ${provider}`);
        this.oidcConfigSetupService.setIdp(provider);
        this.router.navigate([this.identityProviders[provider].url]);
        return true;
    }
}
