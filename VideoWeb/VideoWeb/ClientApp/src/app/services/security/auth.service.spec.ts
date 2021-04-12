import { AuthService } from './auth.service';
import { of } from 'rxjs';
import { MockOidcSecurityService } from '../../testing/mocks/mock-oidc-security.service';
describe('AuthService', () => {
    let oidcSecurityService;
    const mockOidcSecurityService = new MockOidcSecurityService();
    let authService: AuthService;

    beforeAll(() => {
        oidcSecurityService = jasmine.createSpyObj<MockOidcSecurityService>('MockOidcSecurityService', [
            'checkAuth',
            'authorize',
            'logoffAndRevokeTokens',
            'setAuthenticated'
        ]);
    });
    beforeEach(() => {
        authService = new AuthService(oidcSecurityService);
    });
    it('should authorize been called', () => {
        oidcSecurityService.authorize.and.callFake(() => {});
        authService.login();
        expect(oidcSecurityService.authorize).toHaveBeenCalled();
    });
    it('should logoffAndRevokeTokens been called', () => {
        oidcSecurityService.logoffAndRevokeTokens.and.returnValue(of());
        authService.logout();
        expect(oidcSecurityService.logoffAndRevokeTokens).toHaveBeenCalled();
    });
    it('should checkAuth been called', () => {
        oidcSecurityService.checkAuth.and.returnValue(of(true));
        authService.checkAuth();
        expect(oidcSecurityService.checkAuth).toHaveBeenCalled();
    });
});
