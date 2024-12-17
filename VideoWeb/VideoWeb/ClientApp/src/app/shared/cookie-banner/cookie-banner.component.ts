import { Component, EventEmitter, Output } from '@angular/core';
import { cookies } from '../cookies.constants';

@Component({
    selector: 'app-cookie-banner',
    templateUrl: './cookie-banner.component.html',
    styleUrls: ['./cookie-banner.component.css']
})
export class CookieBannerComponent {
    @Output() isBannerVisibleChange = new EventEmitter<boolean>();

    constructor() {
        // Check if the user has already made a decision
        const cookieConsent = localStorage.getItem(cookies.cookieConsentKey);
        this.isBannerVisibleChange.emit(!cookieConsent);
    }

    acceptCookies() {
        localStorage.setItem(cookies.cookieConsentKey, cookies.cookieAccptedValue);
        this.isBannerVisibleChange.emit(false);
    }

    rejectCookies() {
        localStorage.setItem(cookies.cookieConsentKey, cookies.cookieRejectedValue);
        this.isBannerVisibleChange.emit(false);
    }
}
