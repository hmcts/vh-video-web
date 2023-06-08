import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthStateResult, EventTypes, OidcClientNotification, PublicEventsService } from 'angular-auth-oidc-client';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { delay, filter, first, takeUntil } from 'rxjs/operators';
import { ProfileService } from './services/api/profile.service';
import { Role } from './services/clients/api-client';
import { ConnectionStatusService } from './services/connection-status.service';
import { DeviceTypeService } from './services/device-type.service';
import { ErrorService } from './services/error.service';
import { PageTrackerService } from './services/page-tracker.service';
import { pageUrls } from './shared/page-url.constants';
import { TestLanguageService } from './shared/test-language.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { SecurityServiceProvider } from './security/authentication/security-provider.service';
import { ISecurityService } from './security/authentication/security-service.interface';
import { BackLinkDetails } from './shared/models/back-link-details';
import { Location } from '@angular/common';
import { NoSleepService } from './services/no-sleep.service';
import { HideComponentsService } from './waiting-space/services/hide-components.service';
import { ConfigService } from './services/api/config.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
    @ViewChild('maincontent', { static: true })
    main: ElementRef;

    @ViewChild('skipLink', { static: true })
    skipLinkDiv: ElementRef;

    loggedIn = false;
    isRepresentativeOrIndividual: boolean;
    pageTitle = 'Video Hearings - ';

    subscriptions = new Subscription();
    securityService: ISecurityService;
    currentIdp: string;
    backLinkDetails$ = new BehaviorSubject<BackLinkDetails>(null);

    hideNonVideoComponents$ = new Observable<boolean>();

    private destroyed$ = new Subject();
    private serviceChanged$ = new Subject();

    constructor(
        private router: Router,
        private deviceTypeService: DeviceTypeService,
        private profileService: ProfileService,
        private errorService: ErrorService,
        private titleService: Title,
        private activatedRoute: ActivatedRoute,
        private connectionStatusService: ConnectionStatusService,
        pageTracker: PageTrackerService,
        testLanguageService: TestLanguageService,
        translate: TranslateService,
        private configService: ConfigService,
        private eventService: PublicEventsService,
        private securityServiceProviderService: SecurityServiceProvider,
        private location: Location,
        private noSleepService: NoSleepService,
        private logger: Logger,
        private hideBackgroundService: HideComponentsService
    ) {
        this.isRepresentativeOrIndividual = false;

        const language = localStorage.getItem('language') ?? 'en';
        translate.setDefaultLang(language);
        translate.use(language);

        testLanguageService.setupSubscriptions();
        pageTracker.trackPreviousPage(router);

        this.hideNonVideoComponents$ = this.hideBackgroundService.hideNonVideoComponents$;
    }

    get isSignInUrl(): boolean {
        return window.location.pathname.includes(pageUrls.EJudSignIn) || window.location.pathname.includes(pageUrls.VHSignIn);
    }

    ngOnInit() {
        this.checkBrowser();
        this.setupSecurityServiceProviderSubscription();
        this.noSleepService.enable();
        this.configService
            .getClientSettings()
            .pipe(first())
            .subscribe({
                next: () => {
                    this.currentIdp = this.securityServiceProviderService.currentIdp;
                    this.securityService.checkAuth(undefined, this.currentIdp).subscribe(async ({ isAuthenticated }) => {
                        await this.postAuthSetup(isAuthenticated, false);

                        if (this.currentIdp !== 'quickLink') {
                            this.eventService
                                .registerForEvents()
                                .pipe(filter(notification => notification.type === EventTypes.NewAuthenticationResult))
                                .subscribe(async (value: OidcClientNotification<AuthStateResult>) => {
                                    this.logger.info('[AppComponent] - OidcClientNotification event received with value ', value);
                                    await this.postAuthSetup(true, value.value.isRenewProcess);
                                });
                        }
                    });
                }
            });
    }

    setupNavigationSubscriptions() {
        const applTitle = this.titleService.getTitle() + ' - ';
        this.subscriptions.add(
            this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
                let child = this.activatedRoute.firstChild;
                while (child.firstChild) {
                    child = child.firstChild;
                }
                if (child.snapshot.data['title']) {
                    this.setPageTitle(applTitle + child.snapshot.data['title']);
                } else {
                    this.setPageTitle(applTitle);
                }
                this.backLinkDetails$.next(child.snapshot.data['backLink']);
            })
        );

        this.subscriptions.add(
            this.router.events.subscribe({
                next: (event: NavigationEnd) => {
                    if (event instanceof NavigationEnd) {
                        // If the connection has failed and passed the max number of retries, we need to trigger a manual reconnect attempt.
                        this.scrollToTop();
                    }
                }
            })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
        this.destroyed$.next();
    }

    checkBrowser(): void {
        if (!this.deviceTypeService.isSupportedBrowser()) {
            this.router.navigateByUrl(pageUrls.UnsupportedBrowser);
        }
    }

    async retrieveProfileRole(): Promise<void> {
        try {
            const profile = await this.profileService.getUserProfile();
            if (
                profile.role === Role.Representative ||
                profile.role === Role.Individual ||
                profile.role === Role.QuickLinkParticipant ||
                profile.role === Role.QuickLinkObserver
            ) {
                this.isRepresentativeOrIndividual = true;
            }
        } catch (error) {
            this.errorService.goToUnauthorised();
        }
    }

    logOut() {
        this.loggedIn = false;
        sessionStorage.clear();
        this.securityService.logoffAndRevokeTokens(this.currentIdp);
    }

    skipToContent() {
        this.main.nativeElement.focus();
    }

    scrollToTop() {
        window.scroll(0, 0);
        this.skipLinkDiv.nativeElement.focus();
    }

    navigateBack(path: string) {
        if (!path) {
            this.location.back();
        } else {
            this.router.navigate([path]);
        }
    }

    private setPageTitle(title: string) {
        this.titleService.setTitle(title);
    }

    private async postAuthSetup(loggedIn: boolean, skip: boolean) {
        if (skip) {
            return;
        }
        this.loggedIn = loggedIn;

        if (loggedIn) {
            await this.retrieveProfileRole();
        }

        this.setupNavigationSubscriptions();
        this.connectionStatusService.start();
    }

    private setupSecurityServiceProviderSubscription() {
        this.securityServiceProviderService.currentSecurityService$.pipe(takeUntil(this.destroyed$)).subscribe(service => {
            this.securityService = service;
            this.serviceChanged$.next();

            service
                .isAuthenticated(this.securityServiceProviderService.currentIdp)
                .pipe(takeUntil(this.serviceChanged$), takeUntil(this.destroyed$), delay(0)) // delay(0) pipe is to prevent angular ExpressionChangedAfterItHasBeenCheckedError
                .subscribe(authenticated => {
                    this.loggedIn = authenticated;
                });
        });
    }
}
