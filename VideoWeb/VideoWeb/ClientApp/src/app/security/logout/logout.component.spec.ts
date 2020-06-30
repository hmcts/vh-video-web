import { ProfileService } from 'src/app/services/api/profile.service';
import { MockAdalService } from '../../testing/mocks/MockAdalService';
import { LogoutComponent } from './logout.component';
import { SessionStorage } from '../../services/session-storage';
import { VhoStorageKeys } from '../../vh-officer/services/models/session-keys';

describe('LogoutComponent', () => {
    let component: LogoutComponent;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    const mockAdalService = new MockAdalService();
    let adalService;

    beforeAll(() => {
        adalService = mockAdalService;
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['clearUserProfile']);
    });

    beforeEach(() => {
        component = new LogoutComponent(adalService, profileServiceSpy);
    });

    it('should call logout if authenticated', () => {
        const sessionStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
        sessionStorage.set(['one', 'tow']);
        adalService.setAuthenticated(true);
        spyOn(adalService, 'logOut').and.callFake(() => {});
        component.ngOnInit();
        expect(adalService.logOut).toHaveBeenCalled();
        expect(sessionStorage.get()).toBeNull();
    });

    it('should not call logout if unauthenticated', () => {
        adalService.setAuthenticated(false);
        spyOn(adalService, 'logOut').and.callFake(() => {});
        component.ngOnInit();
        expect(adalService.logOut).toHaveBeenCalledTimes(0);
    });

    it('should return true for "loggedIn" when authenticated', () => {
        mockAdalService.setAuthenticated(true);
        expect(component.loggedIn).toBeTruthy();
    });

    it('should return false for "loggedIn" when not authenticated', () => {
        mockAdalService.setAuthenticated(false);
        expect(component.loggedIn).toBeFalsy();
    });
});
