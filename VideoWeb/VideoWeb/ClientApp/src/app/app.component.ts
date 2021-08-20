import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthorizationResult, EventTypes, OidcClientNotification, PublicEventsService } from 'angular-auth-oidc-client';
import { BehaviorSubject, NEVER, Observable, Subject, Subscription } from 'rxjs';
import { catchError, delay, filter, first, takeUntil } from 'rxjs/operators';
import { ConfigService } from './services/api/config.service';
import { ProfileService } from './services/api/profile.service';
import { Role } from './services/clients/api-client';
import { ConnectionStatusService } from './services/connection-status.service';
import { DeviceTypeService } from './services/device-type.service';
import { ErrorService } from './services/error.service';
import { PageTrackerService } from './services/page-tracker.service';
import { pageUrls } from './shared/page-url.constants';
import { TestLanguageService } from './shared/test-language.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { IdpProviders } from './security/idp-providers';
import { SecurityServiceProvider } from './security/authentication/security-provider.service';
import { SecurityConfigSetupService } from './security/security-config-setup.service';
import { ISecurityService } from './security/authentication/security-service.interface';
import { BackLinkDetails } from './shared/models/back-link-details';
import { Location } from '@angular/common';

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
    backLinkDetails$ = new BehaviorSubject<BackLinkDetails>(null);

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
        private securityConfigSetupService: SecurityConfigSetupService,
        private location: Location,
        private logger: Logger
    ) {
        this.isRepresentativeOrIndividual = false;

        const language = localStorage.getItem('language') ?? 'en';
        translate.setDefaultLang(language);
        translate.use(language);

        testLanguageService.setupSubscriptions();
        pageTracker.trackPreviousPage(router);
    }

    ngOnInit() {
        this.checkBrowser();
        this.setupSecurityServiceProviderSubscription();
        this.configService
            .getClientSettings()
            .pipe(first())
            .subscribe({
                next: async () => {
                    if (this.securityConfigSetupService.getIdp() === IdpProviders.quickLink) {
                        this.postConfigSetupQuickLinks();
                    } else {
                        this.postConfigSetupOidc();
                    }
                }
            });
    }

    private postConfigSetupOidc() {
        this.checkAuth().subscribe({
            next: async (loggedIn: boolean) => {
                await this.postAuthSetup(loggedIn, false);
            }
        });
        this.eventService
            .registerForEvents()
            .pipe(filter(notification => notification.type === EventTypes.NewAuthorizationResult))
            .subscribe(async (value: OidcClientNotification<AuthorizationResult>) => {
                this.logger.info('[AppComponent] - OidcClientNotification event received with value ', value);
                await this.postAuthSetup(true, value.value.isRenewProcess);
            });
    }

    private postConfigSetupQuickLinks() {
        this.checkAuth().subscribe({
            next: async (loggedIn: boolean) => {
                await this.postAuthSetup(loggedIn, false);
            }
        });
    }

    private async postAuthSetup(loggedIn: boolean, skip: boolean) {
        if (skip) {
            return;
        }
        this.loggedIn = loggedIn;

        if (loggedIn || this.isSignInUrl) {
            await this.retrieveProfileRole();
        }

        this.setupNavigationSubscriptions();
        this.connectionStatusService.start();
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

    private setupSecurityServiceProviderSubscription() {
        this.securityServiceProviderService.currentSecurityService$.pipe(takeUntil(this.destroyed$)).subscribe(service => {
            this.securityService = service;
            this.serviceChanged$.next();

            service.isAuthenticated$
                .pipe(takeUntil(this.serviceChanged$), takeUntil(this.destroyed$), delay(0)) // delay(0) pipe is to prevent angular ExpressionChangedAfterItHasBeenCheckedError
                .subscribe(authenticated => {
                    this.loggedIn = authenticated;
                });
        });
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

    checkAuth(): Observable<boolean> {
        return this.securityService.checkAuth().pipe(
            catchError(err => {
                this.logger.error('[AppComponent] - Check Auth Error', err);
                if (!this.isSignInUrl) {
                    this.router.navigate(['/']);
                }
                return NEVER;
            })
        );
    }

    get isSignInUrl(): boolean {
        return window.location.pathname.includes(pageUrls.EJudSignIn) || window.location.pathname.includes(pageUrls.VHSignIn);
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
        this.securityService.logoffAndRevokeTokens();
    }

    skipToContent() {
        this.main.nativeElement.focus();
    }

    private setPageTitle(title: string) {
        this.titleService.setTitle(title);
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
}
