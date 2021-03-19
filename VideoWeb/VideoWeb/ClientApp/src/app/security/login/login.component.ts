import { Router } from '@angular/router';
import { OnInit, Component, Injectable } from '@angular/core';
import { ReturnUrlService } from '../../services/return-url.service';
import { Logger } from '../../services/logging/logger-base';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { catchError } from 'rxjs/operators';
import { NEVER } from 'rxjs';

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

    ngOnInit() {
        this.oidcSecurityService
            .checkAuth()
            .pipe(
                catchError(err => {
                    this.logger.error('*** [Login] - Check Auth Error', err);
                    this.router.navigate(['/']);
                    return NEVER;
                })
            )
            .subscribe(loggedIn => {
                this.logger.debug('*** [Login] - isLoggedIn ' + loggedIn);
                this.logger.debug('*** [Login] - TOKEN: ' + this.oidcSecurityService.getToken());
                if (loggedIn) {
                    const returnUrl = this.returnUrlService.popUrl() || '/';
                    this.logger.debug(`*** [Login] - User is authenticated. Returning to ${returnUrl}`);
                    this.router.navigateByUrl(returnUrl);
                } else {
                    this.logger.debug('*** [Login] - User not authenticated. Logging in');
                    try {
                        this.oidcSecurityService.authorize();
                    } catch (err) {
                        this.logger.error('*** [Login] - Authorize Failed', err);
                    }
                }
            });
    }
}
