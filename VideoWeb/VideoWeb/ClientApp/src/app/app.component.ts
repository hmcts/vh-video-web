import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { ConfigService } from './services/api/config.service';
import { DeviceTypeService } from './services/device-type.service';
import { PageUrls } from './shared/page-url.constants';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {

  loggedIn: boolean;
  constructor(private adalService: AdalService,
    private configService: ConfigService,
    private router: Router,
    private deviceTypeService: DeviceTypeService
  ) {
    this.loggedIn = false;
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
    const currentUrl = window.location.href;
    this.adalService.handleWindowCallback();
    this.loggedIn = this.adalService.userInfo.authenticated;
    if (!this.loggedIn) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
    }
  }

  checkBrowser(): void {
    if (!this.deviceTypeService.isSupportedBrowser()) {
      this.router.navigateByUrl(PageUrls.UnsupportedBrowser);
    }
  }

  logOut() {
    this.loggedIn = false;
    sessionStorage.clear();
    this.adalService.logOut();
  }
}
