import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdalService } from 'adal-angular4';

import { ConfigService } from './services/config.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {

  loggedIn: boolean;
  constructor(private adalService: AdalService,
    private configService: ConfigService,
    private router: Router
  ) {
    this.loggedIn = false;
    this.initAuthentication();
  }

  private initAuthentication() {
    const clientSettings = this.configService.clientSettings;
    const config = {
      tenant: clientSettings.tenant_id,
      clientId: clientSettings.client_id,
      postLogoutRedirectUri: clientSettings.post_logout_redirect_uri,
      redirectUri: clientSettings.redirect_uri
    };
    this.adalService.init(config);
  }

  ngOnInit() {
    const currentUrl = window.location.href;
    this.adalService.handleWindowCallback();
    this.loggedIn = this.adalService.userInfo.authenticated;
    if (!this.loggedIn) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
    }
  }

  logOut() {
    this.loggedIn = false;
    sessionStorage.clear();
    this.adalService.logOut();
  }
}
