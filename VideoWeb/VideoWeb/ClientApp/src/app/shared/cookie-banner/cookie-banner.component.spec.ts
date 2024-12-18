import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CookieBannerComponent } from './cookie-banner.component';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';
import { cookies } from '../cookies.constants';

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
        localStorage.clear();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not emit cookieAnswered if cookie consent is found', () => {
        const spy = spyOn(component.cookieAnswered, 'emit');
        localStorage.setItem(cookies.cookieConsentKey, cookies.cookieAccptedValue);
        component = fixture.componentInstance;
        fixture.detectChanges();
        expect(spy).not.toHaveBeenCalled();
    });

    it('should set cookie consent to accepted and emit cookieAnswered when acceptCookies is called', () => {
        const spy = spyOn(component.cookieAnswered, 'emit');
        component.acceptCookies();
        expect(localStorage.getItem(cookies.cookieConsentKey)).toBe(cookies.cookieAccptedValue);
        expect(spy).toHaveBeenCalled();
    });

    it('should set cookie consent to rejected and emit cookieAnswered when rejectCookies is called', () => {
        const spy = spyOn(component.cookieAnswered, 'emit');
        component.rejectCookies();
        expect(localStorage.getItem(cookies.cookieConsentKey)).toBe(cookies.cookieRejectedValue);
        expect(spy).toHaveBeenCalled();
    });
});
