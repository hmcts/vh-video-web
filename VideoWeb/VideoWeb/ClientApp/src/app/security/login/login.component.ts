import { Router, ActivatedRoute } from '@angular/router';
import { OnInit, Component, Injectable } from '@angular/core';
import { AdalService } from 'adal-angular4';
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
        private adalSvc: AdalService,
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
        this.oidcSecurityService.authorize();
        // if (this.adalSvc.userInfo.authenticated) {
        //     const returnUrl = this.returnUrlService.popUrl() || '/';
        //     try {
        //         this.logger.debug(`[Login] - User is authenticated. Returning to ${returnUrl}`);
        //         await this.router.navigateByUrl(returnUrl);
        //     } catch (e) {
        //         this.logger.error('[Login] - Failed to log in', e);
        //         this.router.navigate(['/']);
        //     }
        // } else {
        //     const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        //     this.returnUrlService.setUrl(returnUrl);
        //     this.logger.debug('[Login] - User not authenticated. Logging in', { returnUrl });
        //     this.adalSvc.login();
        // }
    }
}
