import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from '../../shared/page-url.constants';
import { SecurityConfigSetupService } from '../security-config-setup.service';
import { IdpProviders } from '../idp-providers';
import { LaunchDarklyService, FEATURE_FLAGS } from 'src/app/services/launch-darkly.service';
import { IdpSelector } from './models/idp-selection.model';

@Component({
    standalone: false,
    selector: 'app-idp-selection',
    templateUrl: './idp-selection.component.html'
})
export class IdpSelectionComponent implements OnInit {
    idpSelectorModel = new IdpSelector();
    identityProvidernames = [];

    selectedProvider: IdpProviders;
    submitted = false;

    constructor(
        private router: Router,
        private logger: Logger,
        private securityConfigSetupService: SecurityConfigSetupService,
        private ldService: LaunchDarklyService
    ) {}

    ngOnInit(): void {
        this.idpSelectorModel.addIdp(IdpProviders.ejud, '/' + pageUrls.Login);
        this.updateProviderNames();
        this.ldService.getFlag(FEATURE_FLAGS.dom1SignIn).subscribe(featureEnabled => {
            if (featureEnabled) {
                this.idpSelectorModel.addIdp(IdpProviders.dom1, '/' + pageUrls.Login);
            } else {
                this.idpSelectorModel.removeIdp(IdpProviders.dom1);
            }
            this.updateProviderNames();
        });
        this.idpSelectorModel.addIdp(IdpProviders.vhaad, '/' + pageUrls.Login);
        this.updateProviderNames();
    }

    showError(): boolean {
        return this.submitted && !this.selectedProvider;
    }

    updateProviderNames(): void {
        this.identityProvidernames = this.idpSelectorModel.getProviderNames();
    }

    getProviders(): string[] {
        this.identityProvidernames = this.idpSelectorModel.getProviderNames();
        return this.identityProvidernames;
    }

    selectProvider(provider: IdpProviders) {
        this.selectedProvider = provider;
    }

    onSubmit(): boolean {
        this.submitted = true;
        return this.redirectToLogin(this.selectedProvider);
    }

    redirectToLogin(provider: IdpProviders): boolean {
        if (!this.idpSelectorModel.hasProvider(provider)) {
            this.logger.warn(`Provider not found: ${provider}`);
            return false;
        }

        this.logger.debug(`Sending to idp: ${provider}`);
        this.securityConfigSetupService.setIdp(provider);
        this.router.navigate([this.idpSelectorModel.getProviderLogin(provider)]);
        return true;
    }
}
