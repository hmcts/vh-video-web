import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { ConfigService } from './services/api/config.service';
import { DeviceTypeService } from './services/device-type.service';
import { PageUrls } from './shared/page-url.constants';
import { ProfileService } from './services/api/profile.service';
import { ErrorService } from './services/error.service';
import { UserRole } from './services/clients/api-client';
import { Title } from '@angular/platform-browser';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {

  @ViewChild('maincontent', { static: true })
  main: ElementRef;

  @ViewChild('skipLink', { static: true })
  skipLinkDiv: ElementRef;

  loggedIn: boolean;
  isRepresentativeOrIndividual: boolean;
  pageTitle = 'Video Hearings - ';
  constructor(private adalService: AdalService,
    private configService: ConfigService,
    private router: Router,
    private deviceTypeService: DeviceTypeService,
    private profileService: ProfileService,
    private errorService: ErrorService,
    private titleService: Title,
    private activatedRoute: ActivatedRoute
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
    this.setPageTitle();
    this.scrollToTop();
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
        return;
      }
      this.retrieveProfileRole();
    }
  }

  retrieveProfileRole(): void {
    this.profileService.getUserProfile()
      .then((profile) => {
        if (profile.role === UserRole.Representative || profile.role === UserRole.Individual) {
          this.isRepresentativeOrIndividual = true;
        }
      })
      .catch((error) => this.errorService.handleApiError(error));
  }

  logOut() {
    this.loggedIn = false;
    sessionStorage.clear();
    this.adalService.logOut();
  }

  skipToContent() {
    this.main.nativeElement.focus();
  }

  setPageTitle(): void {
    const applTitle = this.titleService.getTitle() + ' - ';
    this.router
      .events.pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => {
          let child = this.activatedRoute.firstChild;
          while (child.firstChild) {
            child = child.firstChild;
          }
          if (child.snapshot.data['title']) {
            return child.snapshot.data['title'];
          }
          return applTitle;
        })
      ).subscribe((appendTitle: string) => {
        this.titleService.setTitle(applTitle + appendTitle);
      });
  }

  scrollToTop() {
    this.router.events.subscribe((event: NavigationEnd) => {
      window.scroll(0, 0);
      this.skipLinkDiv.nativeElement.focus();
    });
  }
}
