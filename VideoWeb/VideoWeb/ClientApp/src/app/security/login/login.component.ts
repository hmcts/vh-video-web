import { Router } from '@angular/router';
import { OnInit, Component, Injectable } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { ReturnUrlService } from '../../services/return-url.service';
import { Logger } from '../../services/logging/logger-base';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html'
})
@Injectable()
export class LoginComponent implements OnInit {
    constructor(private adalSvc: AdalService, private router: Router, private returnUrlService: ReturnUrlService, private logger: Logger) {}

    ngOnInit() {
        this.checkAuthAndRedirect();
    }

    private async checkAuthAndRedirect() {
        if (this.adalSvc.userInfo.authenticated) {
            const returnUrl = this.returnUrlService.popUrl() || '/';
            try {
                this.logger.debug(`[Login] - User is authenticated. Returning to ${returnUrl}`);
                await this.router.navigateByUrl(returnUrl);
            } catch (e) {
                this.logger.error('[Login] - Failed to log in', e);
                this.router.navigate(['/']);
            }
        } else {
            this.logger.debug('[Login] - User not authenticated. Logging in');
            this.adalSvc.login();
        }
    }
}
