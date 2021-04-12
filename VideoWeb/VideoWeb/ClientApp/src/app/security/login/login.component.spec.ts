import { Router } from '@angular/router';
import { ReturnUrlService } from '../../services/return-url.service';
import { MockOidcSecurityService } from '../../testing/mocks/mock-oidc-security.service';
import { MockLogger } from '../../testing/mocks/mock-logger';
import { LoginComponent } from './login.component';
import { fakeAsync, tick } from '@angular/core/testing';
import { ConfigService } from 'src/app/services/api/config.service';
import { of } from 'rxjs';
import { AuthService } from '../../services/security/auth.service';
describe('LoginComponent', () => {
    let component: LoginComponent;
    const mockOidcSecurityService = new MockOidcSecurityService();
    let oidcSecurityService;
    const returnUrlService = new ReturnUrlService();
    let router: jasmine.SpyObj<Router>;
    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    beforeAll(() => {
        oidcSecurityService = mockOidcSecurityService;
        router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings']);
        authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['login']);
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
        component.ngOnInit();
        expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('should call authService login', () => {
        oidcSecurityService.setAuthenticated(false);
        oidcSecurityService.login = jasmine.createSpy().and.callFake(() => { });
        component.ngOnInit();
        expect(oidcSecurityService.login).toHaveBeenCalledTimes(1);
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
});
