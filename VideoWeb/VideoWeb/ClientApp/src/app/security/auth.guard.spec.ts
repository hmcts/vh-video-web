import { Router } from '@angular/router';
import { pageUrls } from '../shared/page-url.constants';
import { MockOidcSecurityService } from '../testing/mocks/MockOidcSecurityService';
import { AuthGuard } from './auth.guard';

describe('authguard', () => {
    let authGuard: AuthGuard;
    let oidcSecurityService;
    const mockOidcSecurityService = new MockOidcSecurityService();
    let router: jasmine.SpyObj<Router>;

    beforeAll(() => {
        oidcSecurityService = mockOidcSecurityService;
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    });

    beforeEach(() => {
        authGuard = new AuthGuard(oidcSecurityService, router);
    });

    describe('when logged in with successful authentication', () => {
        it('canActivate should return true', () => {
            oidcSecurityService.setAuthenticated(true);
            expect(authGuard.canActivate(null, null)).toBeTruthy();
        });
    });

    describe('when login failed with unsuccessful authentication', () => {
        it('canActivate should return false', () => {
            oidcSecurityService.setAuthenticated(false);
            expect(authGuard.canActivate(null, null)).toBeFalsy();
            expect(router.navigate).toHaveBeenCalledWith([`/${pageUrls.IdpSelection}`]);
        });
    });
});
