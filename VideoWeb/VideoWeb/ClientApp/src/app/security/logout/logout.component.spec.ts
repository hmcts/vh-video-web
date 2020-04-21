import { ProfileService } from 'src/app/services/api/profile.service';
import { MockAdalService } from '../../testing/mocks/MockAdalService';
import { LogoutComponent } from './logout.component';

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
        adalService.setAuthenticated(true);
        spyOn(adalService, 'logOut').and.callFake(() => {});
        component.ngOnInit();
        expect(adalService.logOut).toHaveBeenCalled();
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
