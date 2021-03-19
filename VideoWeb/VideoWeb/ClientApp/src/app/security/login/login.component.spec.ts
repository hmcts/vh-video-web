import { Router } from '@angular/router';
import { ReturnUrlService } from '../../services/return-url.service';
import { MockOidcSecurityService } from '../../testing/mocks/MockOidcSecurityService';
import { MockLogger } from '../../testing/mocks/MockLogger';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
    let component: LoginComponent;
    const mockOidcSecurityService = new MockOidcSecurityService();
    let oidcSecurityService;
    const returnUrlService = new ReturnUrlService();
    let router: jasmine.SpyObj<Router>;

    beforeAll(() => {
        oidcSecurityService = mockOidcSecurityService;
        router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
    });

    beforeEach(() => {
        component = new LoginComponent(router, returnUrlService, new MockLogger(), oidcSecurityService);
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

    it('should fallback to root url if return url is invalid', () => {
        spyOn(returnUrlService, 'popUrl').and.returnValue('');
        oidcSecurityService.setAuthenticated(true);
        router.navigateByUrl.and.callFake(() => {
            throw new Error('Invalid URL');
        });
        component.ngOnInit();
        expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
});
