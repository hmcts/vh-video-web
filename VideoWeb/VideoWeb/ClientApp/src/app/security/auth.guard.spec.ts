import { Router } from '@angular/router';
import { MockAdalService } from '../testing/mocks/MockAdalService';
import { AuthGuard } from './auth.guard';

describe('authguard', () => {
    let authGuard: AuthGuard;
    let adalSvc;
    const mockAdalService = new MockAdalService();
    let router: jasmine.SpyObj<Router>;

    beforeAll(() => {
        adalSvc = mockAdalService;
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    });

    beforeEach(() => {
        authGuard = new AuthGuard(adalSvc, router);
    });

    describe('when logged in with successful authentication', () => {
        it('canActivate should return true', () => {
            adalSvc.setAuthenticated(true);
            expect(authGuard.canActivate()).toBeTruthy();
        });
    });

    describe('when login failed with unsuccessful authentication', () => {
        it('canActivate should return false', () => {
            adalSvc.setAuthenticated(false);
            expect(authGuard.canActivate()).toBeFalsy();
            expect(router.navigate).toHaveBeenCalledWith(['/login']);
        });
    });
});
