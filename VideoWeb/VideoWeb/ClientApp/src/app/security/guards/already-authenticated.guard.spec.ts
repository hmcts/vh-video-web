import { fakeAsync, flush, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { SecurityServiceProvider } from '../authentication/security-provider.service';
import { ISecurityService } from '../authentication/security-service.interface';

import { AlreadyAuthenticatedGuard } from './already-authenticated.guard';

describe('AlreadyAuthenticatedGuard', () => {
    let guard: AlreadyAuthenticatedGuard;
    let isAuthenticatedSubject: Subject<boolean>;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;
    let securityServiceProviderSpy: jasmine.SpyObj<SecurityServiceProvider>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(() => {
        isAuthenticatedSubject = new Subject<boolean>();
        securityServiceSpy = jasmine.createSpyObj<ISecurityService>('ISecurityService', [], ['isAuthenticated$']);
        getSpiedPropertyGetter(securityServiceSpy, 'isAuthenticated$').and.returnValue(isAuthenticatedSubject.asObservable());

        securityServiceProviderSpy = jasmine.createSpyObj<SecurityServiceProvider>('SecurityServiceProvider', ['getSecurityService']);
        securityServiceProviderSpy.getSecurityService.and.returnValue(securityServiceSpy);

        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

        TestBed.configureTestingModule({
            providers: [
                { provide: SecurityServiceProvider, useValue: securityServiceProviderSpy },
                { provide: Router, useValue: routerSpy }
            ]
        });
        guard = TestBed.inject(AlreadyAuthenticatedGuard);
    });

    it('should NOT activate and navigate to logout if the user is authenticated', fakeAsync(() => {
        // Act
        let canActivate = true;
        guard.canActivate().subscribe(activate => (canActivate = activate));
        flush();
        isAuthenticatedSubject.next(true);
        flush();

        // Assert
        expect(routerSpy.navigate).toHaveBeenCalledWith([pageUrls.Logout]);
        expect(canActivate).toBeFalse();
    }));

    it('should activate and NOT navigate to logout if the user is NOT authenticated', fakeAsync(() => {
        // Act
        let canActivate = true;
        guard.canActivate().subscribe(activate => (canActivate = activate));
        flush();
        isAuthenticatedSubject.next(false);
        flush();

        // Assert
        expect(routerSpy.navigate).not.toHaveBeenCalled();
        expect(canActivate).toBeTrue();
    }));

    it('should only take one emitted value', fakeAsync(() => {
        // Act
        let canActivate = true;
        guard.canActivate().subscribe(activate => (canActivate = activate));
        flush();
        isAuthenticatedSubject.next(false);
        flush();
        isAuthenticatedSubject.next(true);
        flush();
        isAuthenticatedSubject.next(true);
        flush();

        // Assert
        expect(routerSpy.navigate).not.toHaveBeenCalled();
        expect(canActivate).toBeTrue();
    }));
});
