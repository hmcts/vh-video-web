import { Component, EventEmitter, Output } from '@angular/core';
import { cookies } from '../cookies.constants';

@Component({
    selector: 'app-cookie-banner',
    templateUrl: './cookie-banner.component.html'
})
export class CookieBannerComponent {
    @Output() cookieAnswered = new EventEmitter();

    constructor() {
        // Check if the user has already made a decision
        const cookieConsent = localStorage.getItem(cookies.cookieConsentKey);
        this.cookieAnswered.emit(!cookieConsent);
    }

    acceptCookies() {
        localStorage.setItem(cookies.cookieConsentKey, cookies.cookieAccptedValue);
        this.cookieAnswered.emit();
    }

    rejectCookies() {
        localStorage.setItem(cookies.cookieConsentKey, cookies.cookieRejectedValue);
        this.cookieAnswered.emit();
    }
}
