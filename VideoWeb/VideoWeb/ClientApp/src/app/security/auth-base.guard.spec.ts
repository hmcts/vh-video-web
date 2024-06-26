import { fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { Logger } from '../services/logging/logger-base';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';
import { AuthGuard } from './auth.guard';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { ISecurityService } from './authentication/security-service.interface';
import { pageUrls } from '../shared/page-url.constants';
import { IdpProviders } from './idp-providers';

describe('authguard', () => {
    let authGuard: AuthGuard;
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProvider>;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;
    let router: jasmine.SpyObj<Router>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    beforeAll(() => {
        securityServiceSpy = jasmine.createSpyObj<ISecurityService>('ISecurityService', ['isAuthenticated']);
        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProvider>(
            'SecurityServiceProviderService',
            [],
            ['currentSecurityService$', 'currentIdp$']
        );
        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentSecurityService$').and.returnValue(of(securityServiceSpy));
        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentIdp$').and.returnValue(of(IdpProviders.vhaad));
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
        loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['debug']);
    });

    beforeEach(() => {
        authGuard = new AuthGuard(securityServiceProviderServiceSpy, router, loggerSpy);
    });

    describe('when logged in with successful authentication', () => {
        it('canActivate should return true', fakeAsync(() => {
            // Arrange
            const isAuthenticatedSubject = new Subject<boolean>();
            securityServiceSpy.isAuthenticated.and.returnValue(isAuthenticatedSubject.asObservable());

            // Act
            let result = false;
            authGuard.canActivate(null, null).subscribe(canActivate => (result = canActivate));
            isAuthenticatedSubject.next(true);
            tick();

            // Assert
            expect(result).toBeTruthy();
        }));
    });

    describe('when login failed with unsuccessful authentication', () => {
        const testcases = [{ flag: true, routePath: `/${pageUrls.IdpSelection}` }];
        testcases.forEach(test => {
            it(`canActivate should return false and navigate to ${test.routePath} when multi-idp-selection feature flag set to ${
                test.flag ? 'on' : 'off'
            }`, fakeAsync(() => {
                // Arrange
                const isAuthenticatedSubject = new Subject<boolean>();
                securityServiceSpy.isAuthenticated.and.returnValue(isAuthenticatedSubject.asObservable());

                // Act
                let result = true;
                authGuard.canActivate(null, null).subscribe(canActivate => (result = canActivate));
                isAuthenticatedSubject.next(false);
                tick();

                // Assert
                expect(result).toBeFalsy();
                expect(router.navigate).toHaveBeenCalledWith([test.routePath]);
            }));
        });
    });
});
