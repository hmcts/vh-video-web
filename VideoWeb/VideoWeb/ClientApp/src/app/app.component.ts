import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NEVER, Observable, Subscription } from 'rxjs';
import { catchError, filter, map } from 'rxjs/operators';
import { ProfileService } from './services/api/profile.service';
import { Role } from './services/clients/api-client';
import { DeviceTypeService } from './services/device-type.service';
import { ErrorService } from './services/error.service';
import { LocationService } from './services/location.service';
import { PageTrackerService } from './services/page-tracker.service';
import { EventsService } from './services/events.service';
import { ConnectionStatusService } from './services/connection-status.service';
import { pageUrls } from './shared/page-url.constants';
import { TestLanguageService } from './shared/test-language.service';
import { TranslateService } from '@ngx-translate/core';
import { ConfigService } from './services/api/config.service';
import { AuthService } from './services/security/auth.service';

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

    loggedIn: boolean;
    isRepresentativeOrIndividual: boolean;
    pageTitle = 'Video Hearings - ';

    subscriptions = new Subscription();
    constructor(
        private router: Router,
        private deviceTypeService: DeviceTypeService,
        private profileService: ProfileService,
        private errorService: ErrorService,
        private titleService: Title,
        private activatedRoute: ActivatedRoute,
        private locationService: LocationService,
        private eventsService: EventsService,
        private connectionStatusService: ConnectionStatusService,
        pageTracker: PageTrackerService,
        testLanguageService: TestLanguageService,
        translate: TranslateService,
        private authService: AuthService,
        private configService: ConfigService
    ) {
        this.loggedIn = false;
        this.isRepresentativeOrIndividual = false;

        const language = localStorage.getItem('language') ?? 'en';
        translate.setDefaultLang(language);
        translate.use(language);

        testLanguageService.setupSubscriptions();
        pageTracker.trackPreviousPage(router);
    }

    ngOnInit() {
        this.configService.getClientSettings().subscribe({
            next: async () => {
                this.postConfigSetup();
            }
        });
    }

    private postConfigSetup() {
        this.checkAuth().subscribe({
            next: async (loggedIn: boolean) => {
                await this.postAuthSetup(loggedIn);
            }
        });
    }

    private async postAuthSetup(loggedIn: boolean) {
        this.loggedIn = loggedIn;
        await this.attemptRetrieveProfile(loggedIn);
        this.checkBrowser();
        this.setPageTitle();
        this.setupSubscribers();
        this.eventsService.start();
        this.connectionStatusService.start();
    }

    private async attemptRetrieveProfile(loggedIn: boolean) {
        if (!loggedIn) {
            const currentUrl = this.locationService.getCurrentUrl();
            if (currentUrl.indexOf(pageUrls.Logout) > -1) {
                this.router.navigate([`/${pageUrls.Logout}`]);
            } else {
                this.router.navigate([`/${pageUrls.IdpSelection}`], { queryParams: { returnUrl: currentUrl } });
            }
        } else {
            await this.retrieveProfileRole();
        }
    }

    private setupSubscribers() {
        this.subscriptions.add(
            this.router.events.subscribe({
                next: (event: NavigationEnd) => {
                    if (event instanceof NavigationEnd) {
                        // If the connection has failed and passed the max number of retries, we need to trigger a manual reconnect attempt.
                        this.eventsService.start();
                        this.scrollToTop();
                    }
                }
            })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    checkBrowser(): void {
        if (!this.deviceTypeService.isSupportedBrowser()) {
            this.router.navigateByUrl(pageUrls.UnsupportedBrowser);
        }
    }

    checkAuth(): Observable<boolean> {
        return this.authService.checkAuth().pipe(
            catchError(err => {
                console.error('[AppComponent] - Check Auth Error', err);
                this.router.navigate(['/']);
                return NEVER;
            })
        );
    }

    async retrieveProfileRole(): Promise<void> {
        try {
            const profile = await this.profileService.getUserProfile();
            if (profile.role === Role.Representative || profile.role === Role.Individual) {
                this.isRepresentativeOrIndividual = true;
            }
        } catch (error) {
            this.errorService.goToUnauthorised();
        }
    }

    logOut() {
        this.loggedIn = false;
        sessionStorage.clear();
        this.authService.logout();
    }

    skipToContent() {
        this.main.nativeElement.focus();
    }

    setPageTitle(): void {
        const applTitle = this.titleService.getTitle() + ' - ';
        this.subscriptions.add(
            this.router.events
                .pipe(
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
                )
                .subscribe({
                    next: (appendTitle: string) => {
                        this.titleService.setTitle(applTitle + appendTitle);
                    }
                })
        );
    }

    scrollToTop() {
        window.scroll(0, 0);
        this.skipLinkDiv.nativeElement.focus();
    }
}
