import { Router, ActivatedRoute } from '@angular/router';
import { OnInit, Component, Injectable } from '@angular/core';
import { ReturnUrlService } from '../../services/return-url.service';
import { Logger } from '../../services/logging/logger-base';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html'
})
@Injectable()
export class LoginComponent implements OnInit {
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private returnUrlService: ReturnUrlService,
        private logger: Logger,
        private oidcSecurityService: OidcSecurityService
    ) {}

    ngOnInit() {
        this.checkAuthAndRedirect();
    }

    private async checkAuthAndRedirect() {
        console.log('***** login');
        const isLoggedIn = await this.oidcSecurityService.checkAuth().toPromise();

        if (isLoggedIn) {
            const returnUrl = this.returnUrlService.popUrl() || '/';
            try {
                this.logger.debug(`[Login] - User is authenticated. Returning to ${returnUrl}`);
                console.log(`[Login] - User is authenticated. Returning to ${returnUrl}`);
                await this.router.navigateByUrl(returnUrl);
            } catch (e) {
                this.logger.error('[Login] - Failed to log in', e);
                this.router.navigate(['/']);
            }
        } else {
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
            this.returnUrlService.setUrl(returnUrl);
            this.logger.debug('[Login] - User not authenticated. Logging in', { returnUrl });
            console.log('[Login] - User not authenticated. Logging in', { returnUrl });
            this.oidcSecurityService.authorize();
            console.log('***** TOKEN: ' + this.oidcSecurityService.getToken());
        }
    }
}
