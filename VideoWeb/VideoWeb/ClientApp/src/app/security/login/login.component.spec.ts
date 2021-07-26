import { Router } from '@angular/router';
import { ReturnUrlService } from '../../services/return-url.service';
import { MockOidcSecurityService } from '../../testing/mocks/mock-oidc-security.service';
import { MockLogger } from '../../testing/mocks/mock-logger';
import { LoginComponent } from './login.component';
import { fakeAsync, flush, tick } from '@angular/core/testing';
import { ConfigService } from 'src/app/services/api/config.service';
import { Observable, of, Subject } from 'rxjs';
import { SecurityServiceProviderService } from '../authentication/security-service-provider.service';
import { ISecurityService } from '../authentication/security-service.interface';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';

describe('LoginComponent', () => {
    let component: LoginComponent;
    const returnUrlService = new ReturnUrlService();
    let router: jasmine.SpyObj<Router>;
    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProviderService>;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;
    let isAuthenticatedSubject: Subject<boolean>;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings']);
    });

    beforeEach(() => {
        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProviderService>(
            'SecurityServiceProviderService',
            [],
            ['currentSecurityService$']
        );

        securityServiceSpy = jasmine.createSpyObj<ISecurityService>('ISecurityService', [], ['isAuthenticated$']);
        isAuthenticatedSubject = new Subject<boolean>();
        getSpiedPropertyGetter(securityServiceSpy, 'isAuthenticated$').and.returnValue(isAuthenticatedSubject.asObservable());

        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentSecurityService$').and.returnValue(of(securityServiceSpy));

        component = new LoginComponent(router, returnUrlService, new MockLogger(), securityServiceProviderServiceSpy, configServiceSpy);
        configServiceSpy.getClientSettings.and.returnValue(of(null));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should use saved return url', fakeAsync(() => {
        // Arrange
        spyOn(returnUrlService, 'popUrl').and.returnValue('testurl');

        // Act
        component.ngOnInit();
        isAuthenticatedSubject.next(true);
        flush();

        // Assert
        expect(router.navigateByUrl).toHaveBeenCalledWith('testurl');
    }));

    it('should return to root url if no return path is given', fakeAsync(() => {
        spyOn(returnUrlService, 'popUrl').and.returnValue('');

        component.ngOnInit();
        isAuthenticatedSubject.next(true);
        flush();

        expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    }));

    it('should fallback to root url if return url is invalid', fakeAsync(() => {
        spyOn(returnUrlService, 'popUrl').and.returnValue('');

        router.navigateByUrl.and.callFake(() => {
            throw new Error('Invalid URL');
        });

        component.ngOnInit();
        isAuthenticatedSubject.next(true);
        flush();

        expect(router.navigate).toHaveBeenCalledWith(['/']);
    }));

    it('should use saved return url if pathname includes ejud-signin', fakeAsync(() => {
        spyOn(returnUrlService, 'popUrl').and.returnValue('/ejud-signin');

        component.ngOnInit();
        isAuthenticatedSubject.next(true);
        flush();

        expect(router.navigateByUrl).toHaveBeenCalledWith('/ejud-signin');
    }));

    it('should use saved return url if pathname includes vh-signin', fakeAsync(() => {
        spyOn(returnUrlService, 'popUrl').and.returnValue('/vh-signin');

        component.ngOnInit();
        isAuthenticatedSubject.next(true);
        flush();

        expect(router.navigateByUrl).toHaveBeenCalledWith('/vh-signin');
    }));

    it('should fallback to root url if return ejud url & error', fakeAsync(() => {
        spyOn(returnUrlService, 'popUrl').and.returnValue('/ejud-signin');

        getSpiedPropertyGetter(securityServiceSpy, 'isAuthenticated$').and.returnValue(
            new Observable<boolean>(() => {
                throw new Error('');
            })
        );
        router.navigateByUrl.and.callFake(() => {
            throw new Error('Invalid URL');
        });

        component.ngOnInit();
        flush();

        expect(router.navigate).toHaveBeenCalledWith(['/']);
    }));

    it('should fallback to root url if return ejud url & error', fakeAsync(() => {
        spyOn(returnUrlService, 'popUrl').and.returnValue('/vh-signin');
        getSpiedPropertyGetter(securityServiceSpy, 'isAuthenticated$').and.returnValue(
            new Observable<boolean>(() => {
                throw new Error('');
            })
        );
        router.navigateByUrl.and.callFake(() => {
            throw new Error('Invalid URL');
        });

        component.ngOnInit();
        tick();

        expect(router.navigate).toHaveBeenCalledWith(['/']);
    }));
});
