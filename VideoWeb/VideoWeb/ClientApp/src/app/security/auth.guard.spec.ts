import { fakeAsync, flush } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';
import { pageUrls } from '../shared/page-url.constants';
import { AuthGuard } from './auth.guard';
import { SecurityServiceProviderService } from './authentication/security-service-provider.service';
import { ISecurityService } from './authentication/security-service.interface';

describe('authguard', () => {
    let authGuard: AuthGuard;
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProviderService>;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;
    let router: jasmine.SpyObj<Router>;

    beforeAll(() => {
        securityServiceSpy = jasmine.createSpyObj<ISecurityService>('ISecurityService', [], ['isAuthenticated$']);
        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProviderService>(
            'SecurityServiceProviderService',
            [],
            ['currentSecurityService$']
        );
        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentSecurityService$').and.returnValue(of(securityServiceSpy));
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    });

    beforeEach(() => {
        authGuard = new AuthGuard(securityServiceProviderServiceSpy, router);
    });

    describe('when logged in with successful authentication', () => {
        it('canActivate should return true', fakeAsync(() => {
            // Arrange
            const isAuthenticatedSubject = new Subject<boolean>();
            getSpiedPropertyGetter(securityServiceSpy, 'isAuthenticated$').and.returnValue(isAuthenticatedSubject.asObservable());

            // Act
            let result = false;
            authGuard.canActivate(null, null).subscribe(canActivate => (result = canActivate));
            isAuthenticatedSubject.next(true);
            flush();

            // Assert
            expect(result).toBeTruthy();
        }));
    });

    describe('when login failed with unsuccessful authentication', () => {
        it('canActivate should return false', fakeAsync(() => {
            // Arrange
            const isAuthenticatedSubject = new Subject<boolean>();
            getSpiedPropertyGetter(securityServiceSpy, 'isAuthenticated$').and.returnValue(isAuthenticatedSubject.asObservable());

            // Act
            let result = true;
            authGuard.canActivate(null, null).subscribe(canActivate => (result = canActivate));
            isAuthenticatedSubject.next(false);
            flush();

            // Assert
            expect(result).toBeFalsy();
        }));
    });
});
