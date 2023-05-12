import { fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { Logger } from '../services/logging/logger-base';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';
import { AuthGuard } from './auth.guard';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { ISecurityService } from './authentication/security-service.interface';
import { pageUrls } from '../shared/page-url.constants';
import { FEATURE_FLAGS, LaunchDarklyService } from '../services/launch-darkly.service';

describe('authguard', () => {
    let authGuard: AuthGuard;
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProvider>;
    let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;
    let router: jasmine.SpyObj<Router>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    beforeAll(() => {
        securityServiceSpy = jasmine.createSpyObj<ISecurityService>('ISecurityService', [], ['isAuthenticated$']);

        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);

        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProvider>(
            'SecurityServiceProviderService',
            [],
            ['currentSecurityService$']
        );
        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentSecurityService$').and.returnValue(of(securityServiceSpy));
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
        loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['debug']);
    });

    beforeEach(() => {
        authGuard = new AuthGuard(securityServiceProviderServiceSpy, router, loggerSpy, launchDarklyServiceSpy);
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.multiIdpSelection).and.returnValue(of(true));
    });

    describe('when logged in with successful authentication', () => {
        it('canActivate should return true', fakeAsync(() => {
            // Arrange
            const isAuthenticatedSubject = new Subject<boolean>();
            getSpiedPropertyGetter(securityServiceSpy, 'isAuthenticated$').and.returnValue(isAuthenticatedSubject.asObservable());

            // Act
            let result = false;
            authGuard.canActivate(null, null).subscribe(canActivate => (result = canActivate));
            launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.multiIdpSelection).and.returnValue(of(false));
            isAuthenticatedSubject.next(true);
            tick();

            // Assert
            expect(result).toBeTruthy();
        }));
    });

    describe('when login failed with unsuccessful authentication', () => {
        const testcases = [
            { flag: true, routePath: `/${pageUrls.IdpSelection}` },
            { flag: false, routePath: `/${pageUrls.Login}` }
        ];
        testcases.forEach(test => {
            it(`canActivate should return false and navigate to ${test.routePath} when multi-idp-selection feature flag set to ${
                test.flag ? 'on' : 'off'
            }`, fakeAsync(() => {
                // Arrange
                launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.multiIdpSelection).and.returnValue(of(test.flag));
                const isAuthenticatedSubject = new Subject<boolean>();
                getSpiedPropertyGetter(securityServiceSpy, 'isAuthenticated$').and.returnValue(isAuthenticatedSubject.asObservable());

                // Act
                let result = true;
                authGuard.canActivate(null, null).subscribe(canActivate => (result = canActivate));
                isAuthenticatedSubject.next(false);
                launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.multiIdpSelection).and.returnValue(of(test.flag));
                tick();

                // Assert
                expect(result).toBeFalsy();
                expect(router.navigate).toHaveBeenCalledWith([test.routePath]);
            }));
        });
    });
});
