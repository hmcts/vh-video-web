import { ProfileService } from 'src/app/services/api/profile.service';
import { MockOidcSecurityService } from '../../testing/mocks/MockOidcSecurityService';
import { LogoutComponent } from './logout.component';
import { SessionStorage } from '../../services/session-storage';
import { VhoStorageKeys } from '../../vh-officer/services/models/session-keys';

describe('LogoutComponent', () => {
    let component: LogoutComponent;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    const mockOidcSecurityService = new MockOidcSecurityService();
    let oidcSecurityService;

    beforeAll(() => {
        oidcSecurityService = mockOidcSecurityService;
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['clearUserProfile']);
    });

    beforeEach(() => {
        component = new LogoutComponent(oidcSecurityService, profileServiceSpy);
    });

    it('should call logout if authenticated', () => {
        const sessionStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
        sessionStorage.set(['one', 'tow']);
        oidcSecurityService.setAuthenticated(true);
        spyOn(oidcSecurityService, 'logoffAndRevokeTokens').and.callFake(() => {});
        component.ngOnInit();
        expect(oidcSecurityService.logoffAndRevokeTokens).toHaveBeenCalled();
        expect(sessionStorage.get()).toBeNull();
    });

    it('should not call logout if unauthenticated', () => {
        oidcSecurityService.setAuthenticated(false);
        spyOn(oidcSecurityService, 'logoffAndRevokeTokens').and.callFake(() => {});
        component.ngOnInit();
        expect(oidcSecurityService.logoffAndRevokeTokens).toHaveBeenCalledTimes(0);
    });

    it('should return true for "loggedIn" when authenticated', async () => {
        mockOidcSecurityService.setAuthenticated(true);
        const loggedIn = await component.loggedIn.toPromise();
        expect(loggedIn).toBeTruthy();
    });

    it('should return false for "loggedIn" when not authenticated', async () => {
        mockOidcSecurityService.setAuthenticated(false);
        const loggedIn = await component.loggedIn.toPromise();
        expect(loggedIn).toBeFalsy();
    });
});
