import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { Logger } from 'src/app/services/logging/logger-base';
import { ReturnUrlService } from 'src/app/services/return-url.service';
import { pageUrls } from '../../shared/page-url.constants';

@Component({
    selector: 'app-idp-selection',
    templateUrl: './idp-selection.component.html'
})
export class IdpSelectionComponent implements OnInit {
    identityProviders = {
        ejud: {
            url: ''
        },
        vhaad: {
            url: '/' + pageUrls.Login
        }
    };

    selectedProvider: string;
    submitted = false;

    constructor(
        private adalSvc: AdalService,
        private route: ActivatedRoute,
        private router: Router,
        private returnUrlService: ReturnUrlService,
        private logger: Logger
    ) {}

    ngOnInit(): void {
        if (this.isLoggedIn()) {
            const returnUrl = this.returnUrlService.popUrl() || '/';
            try {
                this.logger.debug(`[Login] - User is authenticated. Returning to ${returnUrl}`);
                this.router.navigateByUrl(returnUrl);
            } catch (e) {
                this.logger.error('[Login] - Failed to log in', e);
                this.router.navigate(['/']);
            }
        } else {
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
            this.returnUrlService.setUrl(returnUrl);

            const routeIdp = this.route.snapshot.queryParams['idp'];
            if (routeIdp && this.identityProviders[routeIdp]) {
                this.redirectToLogin(routeIdp);
            }
        }
    }

    showError(): boolean {
        return this.submitted && !this.selectedProvider;
    }

    isLoggedIn(): boolean {
        return this.adalSvc.userInfo.authenticated;
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
        this.router.navigate([this.identityProviders[provider].url]);
        return true;
    }
}
