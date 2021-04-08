import { Location } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateService } from '@ngx-translate/core';
import { configureTestSuite } from 'ng-bullet';
import { Logger } from 'src/app/services/logging/logger-base';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { ContactUsStubComponent } from 'src/app/testing/stubs/contact-us-stub';
import { DashboardStubComponent } from 'src/app/testing/stubs/dashboard-stub';
import { UnsupportedBrowserStubComponent } from 'src/app/testing/stubs/unsupported-browser-stub';

import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
    let component: FooterComponent;
    let fixture: ComponentFixture<FooterComponent>;
    let location: Location;
    let router: Router;

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            declarations: [
                FooterComponent,
                DashboardStubComponent,
                ContactUsStubComponent,
                UnsupportedBrowserStubComponent,
                TranslatePipeMock
            ],
            imports: [
                RouterTestingModule.withRoutes([
                    { path: 'dashboard', component: DashboardStubComponent },
                    { path: 'contact-us', component: ContactUsStubComponent },
                    { path: 'unsupported-browser', component: UnsupportedBrowserStubComponent }
                ])
            ],
            providers: [
                { provide: TranslateService, useValue: translateServiceSpy },
                { provide: Logger, useClass: MockLogger }
            ],
            schemas: [NO_ERRORS_SCHEMA]
        });
    });

    beforeEach(() => {
        translateServiceSpy.setDefaultLang.calls.reset();
        translateServiceSpy.use.calls.reset();

        router = TestBed.inject(Router);
        location = TestBed.inject(Location);
        fixture = TestBed.createComponent(FooterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('navigate to dashboard you should see contact us link in the footer', fakeAsync(() => {
        router.navigate(['dashboard']);
        tick();
        expect(location.path()).toBe('/dashboard');
        expect(component.hideContactUsLink).toBeFalsy();
    }));

    it('navigate to contact-us you should not see contact us link in the footer', fakeAsync(() => {
        router.navigate(['contact-us']);
        tick();
        expect(location.path()).toBe('/contact-us');
        expect(component.hideContactUsLink).toBeTruthy();
    }));

    it('navigate to any page with supported browser you should see the links in the footer', fakeAsync(() => {
        router.navigate(['dashboard']);
        tick();
        expect(location.path()).toBe('/dashboard');
        expect(component.hideLinksForUnsupportedBrowser).toBeFalsy();
    }));

    it('navigate to unsupported browser you should not see the links in the footer', fakeAsync(() => {
        router.navigate(['unsupported-browser']);
        tick();
        expect(location.path()).toBe('/unsupported-browser');
        expect(component.hideLinksForUnsupportedBrowser).toBeTruthy();
    }));

    it('should switch language when clicking button, english to welsh', () => {
        // Arrange
        translateServiceSpy.currentLang = 'en';

        // Act
        component.switchLaguage();

        // Assert
        expect(translateServiceSpy.setDefaultLang).toHaveBeenCalledOnceWith('cy');
        expect(translateServiceSpy.use).toHaveBeenCalledOnceWith('cy');
    });

    it('should switch language when clicking button, english to welsh', () => {
        // Arrange
        translateServiceSpy.currentLang = 'cy';

        // Act
        component.switchLaguage();

        // Assert
        expect(translateServiceSpy.setDefaultLang).toHaveBeenCalledOnceWith('en');
        expect(translateServiceSpy.use).toHaveBeenCalledOnceWith('en');
    });

    it('should switch to test language when clicking button', () => {
        // Arrange
        translateServiceSpy.currentLang = 'en';

        // Act
        component.setLanguage('tl');

        // Assert
        expect(translateServiceSpy.setDefaultLang).toHaveBeenCalledOnceWith('tl');
        expect(translateServiceSpy.use).toHaveBeenCalledOnceWith('tl');
    });
});
