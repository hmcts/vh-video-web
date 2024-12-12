import { Component } from '@angular/core';
import { cookies } from '../cookies.constants';

@Component({
    selector: 'app-cookie-banner',
    templateUrl: './cookie-banner.component.html',
    styleUrls: ['./cookie-banner.component.css']
})
export class CookieBannerComponent {
    isBannerVisible: boolean = true;

    constructor() {
        // Check if the user has already made a decision
        const cookieConsent = localStorage.getItem(cookies.cookieConsentKey);
        this.isBannerVisible = !cookieConsent;
    }

    acceptCookies() {
        localStorage.setItem(cookies.cookieConsentKey, cookies.cookieAccptedValue);
        this.isBannerVisible = false;
    }

    rejectCookies() {
        localStorage.setItem(cookies.cookieConsentKey, cookies.cookieRejectedValue);
        this.isBannerVisible = false;
    }
}
