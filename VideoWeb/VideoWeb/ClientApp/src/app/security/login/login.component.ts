import { Router } from '@angular/router';
import { OnInit, Component, Injectable } from '@angular/core';
import { ReturnUrlService } from '../../services/return-url.service';
import { Logger } from '../../services/logging/logger-base';
import { catchError } from 'rxjs/operators';
import { NEVER } from 'rxjs';
import { ConfigService } from 'src/app/services/api/config.service';
import { AuthService } from '../../services/security/auth.service';

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
        private authService: AuthService,
        private configService: ConfigService
    ) {}

    ngOnInit() {
        this.configService.getClientSettings().subscribe(() => {
            this.authService.isAuthenticated$
                .pipe(
                    catchError(err => {
                        this.logger.error('[Login] - Check Auth Error', err);
                        this.router.navigate(['/']);
                        return NEVER;
                    })
                )
                .subscribe(loggedIn => {
                    this.logger.debug('[Login] - isLoggedIn ' + loggedIn);
                    if (loggedIn) {
                        try {
                            const returnUrl = this.returnUrlService.popUrl() || '/';
                            this.logger.debug(`[Login] - User is authenticated. Returning to ${returnUrl}`);
                            this.router.navigateByUrl(returnUrl);
                        } catch (err) {
                            this.logger.error('[Login] - Redirect Failed', err);
                            this.router.navigate(['/']);
                        }
                    } else {
                        this.logger.debug('[Login] - User not authenticated. Logging in');
                        try {
                            this.authService.login();
                        } catch (err) {
                            this.logger.error('[Login] - Authorize Failed', err);
                        }
                    }
                });
        });
    }
}
