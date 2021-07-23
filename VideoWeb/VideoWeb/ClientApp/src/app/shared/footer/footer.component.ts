import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from '../page-url.constants';
import { Subscription } from 'rxjs';
@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit, OnDestroy {
    hideContactUsLink = false;
    privacyPolicyUri = pageUrls.PrivacyPolicy;
    accessibilityUri = pageUrls.Accessibility;
    routerEventsSubscription$: Subscription = new Subscription();

    constructor(private router: Router, private translate: TranslateService, private logger: Logger) {
        this.routerEventsSubscription$.add(
            this.router.events.pipe(filter((event: RouterEvent) => event instanceof NavigationEnd)).subscribe(x => {
                this.hideContactUs();
            })
        );
    }

    ngOnInit() {
        this.hideContactUs();
    }

    ngOnDestroy(): void {
        this.routerEventsSubscription$.unsubscribe();
    }

    hideContactUs() {
        this.hideContactUsLink = this.router.url === '/contact-us';
    }

    switchLaguage() {
        this.setLanguage(this.translate.currentLang === 'en' ? 'cy' : 'en');
    }

    setLanguage(language: string) {
        this.logger.info(`[FooterComponent] - Switching translation language from ${this.translate.currentLang} to ${language}`);
        localStorage.setItem('language', language);
        this.translate.setDefaultLang(language);
        this.translate.use(language);
    }
}
