import { Component, ElementRef, OnDestroy, OnInit, ViewChild, HostListener } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ConfigService } from './services/api/config.service';
import { ProfileService } from './services/api/profile.service';
import { Role } from './services/clients/api-client';
import { DeviceTypeService } from './services/device-type.service';
import { ErrorService } from './services/error.service';
import { LocationService } from './services/location.service';
import { PageTrackerService } from './services/page-tracker.service';
import { pageUrls } from './shared/page-url.constants';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { EventType } from 'src/app/services/clients/api-client';
import { participantPages } from 'src/app/services/participant-status-update.service';

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
        private adalService: AdalService,
        private configService: ConfigService,
        private router: Router,
        private deviceTypeService: DeviceTypeService,
        private profileService: ProfileService,
        private errorService: ErrorService,
        private titleService: Title,
        private activatedRoute: ActivatedRoute,
        private locationService: LocationService,
        private pageTracker: PageTrackerService,
        private participantStatusUpdateService: ParticipantStatusUpdateService
    ) {
        this.loggedIn = false;
        this.isRepresentativeOrIndividual = false;
        this.initAuthentication();

        this.pageTracker.trackPreviousPage(router);
        this.refreshPageParticipant();
    }

    private initAuthentication() {
        const clientSettings = this.configService.getClientSettings();
        const config = {
            tenant: clientSettings.tenant_id,
            clientId: clientSettings.client_id,
            postLogoutRedirectUri: clientSettings.post_logout_redirect_uri,
            redirectUri: clientSettings.redirect_uri,
            cacheLocation: 'sessionStorage'
        };
        this.adalService.init(config);
    }

    ngOnInit() {
        this.checkAuth().then(() => {
            this.checkBrowser();
            this.setPageTitle();
            this.scrollToTop();
        });
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    checkBrowser(): void {
        if (!this.deviceTypeService.isSupportedBrowser()) {
            this.router.navigateByUrl(pageUrls.UnsupportedBrowser);
        }
    }

    async checkAuth(): Promise<void> {
        const currentUrl = this.locationService.getCurrentUrl();
        if (this.locationService.getCurrentPathName() !== `/${pageUrls.Logout}`) {
            this.adalService.handleWindowCallback();
            this.loggedIn = this.adalService.userInfo.authenticated;
            if (!this.loggedIn) {
                this.router.navigate([`/${pageUrls.Login}`], { queryParams: { returnUrl: currentUrl } });
                return;
            }
            await this.retrieveProfileRole();
        }
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
        this.adalService.logOut();
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
                .subscribe((appendTitle: string) => {
                    this.titleService.setTitle(applTitle + appendTitle);
                })
        );
    }

    scrollToTop() {
        this.subscriptions.add(
            this.router.events.subscribe((event: NavigationEnd) => {
                window.scroll(0, 0);
                this.skipLinkDiv.nativeElement.focus();
            })
        );
    }

    @HostListener('window:beforeunload', ['$event'])
    async beforeunloadHandler($event: any) {
        $event.preventDefault();
        await this.participantStatusUpdateService.postParticipantStatus(EventType.ParticipantNotSignedIn);
        $event.returnValue = 'save';
    }

    refreshPageParticipant() {
        this.subscriptions.add(
            this.router.events.subscribe(async event => {
                if (event instanceof NavigationEnd) {
                    const params = event.url.split('/');
                    const isThePage = params.length > 2 && participantPages.findIndex(x => x === params[1]) > -1;
                    if (event.id === 1 && event.url === event.urlAfterRedirects && isThePage) {
                        await this.participantStatusUpdateService.postParticipantStatus(EventType.ParticipantJoining);
                    }
                }
            })
        );
    }
}
