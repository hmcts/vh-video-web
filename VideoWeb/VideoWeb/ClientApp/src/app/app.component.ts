import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { ConfigService } from './services/api/config.service';
import { DeviceTypeService } from './services/device-type.service';
import { PageUrls } from './shared/page-url.constants';
import { ProfileService } from 'src/app/services/api/profile.service';
import { UserRole } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {

  loggedIn: boolean;
  isRepresentativeOrIndividual: boolean;

  constructor(private adalService: AdalService,
    private configService: ConfigService,
    private router: Router,
    private deviceTypeService: DeviceTypeService,
    private profileService: ProfileService,
    private errorService: ErrorService
  ) {
    this.loggedIn = false;
    this.isRepresentativeOrIndividual = false;
    this.initAuthentication();
  }

  private initAuthentication() {
    const clientSettings = this.configService.getClientSettings();
    const config = {
      tenant: clientSettings.tenant_id,
      clientId: clientSettings.client_id,
      postLogoutRedirectUri: clientSettings.post_logout_redirect_uri,
      redirectUri: clientSettings.redirect_uri
    };
    this.adalService.init(config);
  }

  ngOnInit() {
    this.checkBrowser();
    this.checkAuth();
  }

  checkBrowser(): void {
    if (!this.deviceTypeService.isSupportedBrowser()) {
      this.router.navigateByUrl(PageUrls.UnsupportedBrowser);
    }
  }

  checkAuth(): void {
    const currentUrl = window.location.href;
    if (window.location.pathname !== `/${PageUrls.Logout}`) {
      this.adalService.handleWindowCallback();
      this.loggedIn = this.adalService.userInfo.authenticated;
      if (!this.loggedIn) {
        this.router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
      }

    this.profileService.getUserProfile()
      .then((profile) => {
        this.isRepresentativeOrIndividual = (profile.role === (UserRole.Individual || UserRole.Representative));
      })
      .catch((error) => this.errorService.handleApiError(error));
    }
  }

  logOut() {
    this.loggedIn = false;
    sessionStorage.clear();
    this.adalService.logOut();
  }
}
