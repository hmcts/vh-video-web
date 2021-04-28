import { Router } from '@angular/router';
import { ReturnUrlService } from '../../services/return-url.service';
import { MockOidcSecurityService } from '../../testing/mocks/mock-oidc-security.service';
import { MockLogger } from '../../testing/mocks/mock-logger';
import { LoginComponent } from './login.component';
import { fakeAsync, tick } from '@angular/core/testing';
import { ConfigService } from 'src/app/services/api/config.service';
import { of } from 'rxjs';

fdescribe('LoginComponent', () => {
    let component: LoginComponent;
    const mockOidcSecurityService = new MockOidcSecurityService();
    let oidcSecurityService;
    const returnUrlService = new ReturnUrlService();
    let router: jasmine.SpyObj<Router>;
    let configServiceSpy: jasmine.SpyObj<ConfigService>;

    beforeAll(() => {
        oidcSecurityService = mockOidcSecurityService;
        router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings']);
    });

    beforeEach(() => {
        component = new LoginComponent(router, returnUrlService, new MockLogger(), oidcSecurityService, configServiceSpy);
        configServiceSpy.getClientSettings.and.returnValue(of(null));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should use saved return url', () => {
        oidcSecurityService.setAuthenticated(true);
        spyOn(returnUrlService, 'popUrl').and.returnValue('testurl');
        component.ngOnInit();
        expect(router.navigateByUrl).toHaveBeenCalledWith('testurl');
    });

    it('should return to root url if no return path is given', () => {
        oidcSecurityService.setAuthenticated(true);
        spyOn(returnUrlService, 'popUrl').and.returnValue('');
        component.ngOnInit();
        expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('should fallback to root url if return url is invalid', fakeAsync(() => {
        spyOn(returnUrlService, 'popUrl').and.returnValue('');
        oidcSecurityService.setAuthenticated(true);
        router.navigateByUrl.and.callFake(() => {
            throw new Error('Invalid URL');
        });
        component.ngOnInit();
        tick();
        expect(router.navigate).toHaveBeenCalledWith(['/']);
    }));

    it('should use saved return url if pathname includes ejud-signin', () => {
        oidcSecurityService.setAuthenticated(true);
        spyOn(returnUrlService, 'popUrl').and.returnValue('/ejud-signin');
        component.ngOnInit();
        expect(router.navigateByUrl).toHaveBeenCalledWith('/ejud-signin');
    });

    it('should use saved return url if pathname includes vh-signin', () => {
        oidcSecurityService.setAuthenticated(true);
        spyOn(returnUrlService, 'popUrl').and.returnValue('/vh-signin');
        component.ngOnInit();
        expect(router.navigateByUrl).toHaveBeenCalledWith('/vh-signin');
    });
});
