import { Component, EventEmitter, Input, Output } from '@angular/core';
import { cookies } from '../cookies.constants';
//import { DynatraceService } from 'src/app/services/api/dynatrace.service';

@Component({
    selector: 'app-cookie-banner',
    templateUrl: './cookie-banner.component.html',
    styleUrls: ['./cookie-banner.component.css']
})
export class CookieBannerComponent {
    @Input() userName: string;
    @Output() isBannerVisibleChange = new EventEmitter<boolean>();

    constructor() { //private readonly dynatraceService: DynatraceService
        // Check if the user has already made a decision
        const cookieConsent = localStorage.getItem(cookies.cookieConsentKey);
        this.isBannerVisibleChange.emit(!cookieConsent);
    }

    acceptCookies() {
        localStorage.setItem(cookies.cookieConsentKey, cookies.cookieAccptedValue);
        //this.dynatraceService.addUserIdentifyScript(this.userName);
        this.isBannerVisibleChange.emit(false);
    }

    rejectCookies() {
        localStorage.setItem(cookies.cookieConsentKey, cookies.cookieRejectedValue);
        this.isBannerVisibleChange.emit(false);
    }
}
