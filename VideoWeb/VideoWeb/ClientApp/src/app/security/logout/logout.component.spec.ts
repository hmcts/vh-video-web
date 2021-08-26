import { ProfileService } from 'src/app/services/api/profile.service';
import { LogoutComponent } from './logout.component';
import { SessionStorage } from '../../services/session-storage';
import { VhoStorageKeys } from '../../vh-officer/services/models/session-keys';
import { of, Subject } from 'rxjs';
import { SecurityServiceProvider } from '../authentication/security-provider.service';
import { ISecurityService } from '../authentication/security-service.interface';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { fakeAsync, flush } from '@angular/core/testing';

describe('LogoutComponent', () => {
    let component: LogoutComponent;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProvider>;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;
    let isAuthenticatedSubject: Subject<boolean>;

    beforeAll(() => {
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['clearUserProfile']);
    });

    beforeEach(() => {
        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProvider>(
            'SecurityServiceProviderService',
            [],
            ['currentSecurityService$']
        );

        securityServiceSpy = jasmine.createSpyObj<ISecurityService>('ISecurityService', ['logoffAndRevokeTokens'], ['isAuthenticated$']);
        isAuthenticatedSubject = new Subject<boolean>();
        getSpiedPropertyGetter(securityServiceSpy, 'isAuthenticated$').and.returnValue(isAuthenticatedSubject.asObservable());

        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentSecurityService$').and.returnValue(of(securityServiceSpy));

        component = new LogoutComponent(securityServiceProviderServiceSpy, profileServiceSpy);
    });

    it('should call logout if authenticated', fakeAsync(() => {
        const sessionStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
        sessionStorage.set(['one', 'tow']);

        component.ngOnInit();
        isAuthenticatedSubject.next(true);
        flush();

        expect(securityServiceSpy.logoffAndRevokeTokens).toHaveBeenCalled();
        expect(sessionStorage.get()).toBeNull();
    }));

    it('should not call logout if unauthenticated', fakeAsync(() => {
        component.ngOnInit();
        isAuthenticatedSubject.next(false);
        flush();

        expect(securityServiceSpy.logoffAndRevokeTokens).toHaveBeenCalledTimes(0);
    }));

    it('should return true for "loggedIn" when authenticated', fakeAsync(() => {
        let loggedIn = false;
        component.loggedIn.subscribe(isLoggedIn => (loggedIn = isLoggedIn));

        isAuthenticatedSubject.next(true);
        flush();

        expect(loggedIn).toBeTruthy();
    }));

    it('should return false for "loggedIn" when not authenticated', fakeAsync(() => {
        let loggedIn = true;
        component.loggedIn.subscribe(isLoggedIn => (loggedIn = isLoggedIn));

        isAuthenticatedSubject.next(false);
        flush();

        expect(loggedIn).toBeFalsy();
    }));
});
