import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CookieBannerComponent } from './cookie-banner.component';
import { cookies } from '../cookies.constants';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';

describe('CookieBannerComponent', () => {
    let component: CookieBannerComponent;
    let fixture: ComponentFixture<CookieBannerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CookieBannerComponent, TranslatePipeMock]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CookieBannerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show banner if no cookie consent is found', () => {
        localStorage.removeItem(cookies.cookieConsentKey);
        component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component.isBannerVisible).toBeTrue();
    });

    it('should set cookie consent to accepted and hide banner when acceptCookies is called', () => {
        component.acceptCookies();
        expect(localStorage.getItem(cookies.cookieConsentKey)).toBe(cookies.cookieAccptedValue);
        expect(component.isBannerVisible).toBeFalse();
    });

    it('should set cookie consent to rejected and hide banner when rejectCookies is called', () => {
        component.rejectCookies();
        expect(localStorage.getItem(cookies.cookieConsentKey)).toBe(cookies.cookieRejectedValue);
        expect(component.isBannerVisible).toBeFalse();
    });
});
