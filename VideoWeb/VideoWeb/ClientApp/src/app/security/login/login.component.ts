import { Router } from '@angular/router';
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
        private router: Router,
        private returnUrlService: ReturnUrlService,
        private logger: Logger,
        private oidcSecurityService: OidcSecurityService
    ) {}

    async ngOnInit() {
        await this.checkAuthAndRedirect();
    }

    private async checkAuthAndRedirect() {
        console.log('***** login');
        this.oidcSecurityService.checkAuth().subscribe(async (auth) => {
            console.log('***** checkAuthAndRedirect: AUTH', auth);
        });
        const isLoggedIn = await this.oidcSecurityService.checkAuth().toPromise();
        console.log('***** LoginComponent: isLoggedIn', isLoggedIn);
        console.log('***** TOKEN: ' + this.oidcSecurityService.getToken());

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
            this.logger.debug('[Login] - User not authenticated. Logging in', { returnUrl });
            console.log('[Login] - User not authenticated. Logging in', { returnUrl });
            this.oidcSecurityService.authorize();
        }
    }
}
