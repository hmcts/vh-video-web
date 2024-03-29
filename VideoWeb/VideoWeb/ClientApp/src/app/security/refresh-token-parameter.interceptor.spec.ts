import { HttpEvent, HttpHandler, HttpRequest } from '@angular/common/http';
import { Injector } from '@angular/core';
import { fakeAsync, flush } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { Logger } from '../services/logging/logger-base';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { ISecurityService } from './authentication/security-service.interface';
import { IdpProviders } from './idp-providers';
import { RefreshTokenParameterInterceptor } from './refresh-token-parameter.interceptor';

describe('RefreshTokenParameterInterceptor', () => {
    let sut: RefreshTokenParameterInterceptor;
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProvider>;
    let currentIdpSubject: Subject<IdpProviders>;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;
    let loggerSpy: jasmine.SpyObj<Logger>;
    let injectorSpy: jasmine.SpyObj<Injector>;

    beforeEach(() => {
        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProvider>(
            'SecurityServiceProviderService',
            ['getSecurityService'],
            ['currentIdp$']
        );

        currentIdpSubject = new Subject<IdpProviders>();
        securityServiceSpy = jasmine.createSpyObj<ISecurityService>('ISecurityService', ['getConfiguration']);
        securityServiceSpy.getConfiguration.and.returnValue(of({ scope: 'openid profile offline_access', secureRoutes: ['.'] }));

        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentIdp$').and.returnValue(currentIdpSubject.asObservable());
        securityServiceProviderServiceSpy.getSecurityService.and.returnValue(securityServiceSpy);

        loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['debug']);
        injectorSpy = jasmine.createSpyObj<Injector>('Injector', ['get']);
        injectorSpy.get.and.returnValue(loggerSpy);

        sut = new RefreshTokenParameterInterceptor(securityServiceProviderServiceSpy, injectorSpy);
    });

    for (const provider of [IdpProviders.ejud, IdpProviders.vhaad, IdpProviders.dom1]) {
        describe(`when provider is ${provider.toString()}`, () => {
            it('should call next with updated body if token request post', fakeAsync(() => {
                // Arrange
                const next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
                let result: HttpRequest<any>;
                next.handle.and.callFake(req => {
                    result = req;
                    return of({} as HttpEvent<any>);
                });
                const request = new HttpRequest<any>('POST', '/oauth2/v2.0/token', 'params1');

                currentIdpSubject.next(provider);
                flush();

                // Act
                sut.intercept(request, next).subscribe(() => {});
                flush();

                // Assert
                expect(result.body).toBe(`${request.body}&scope=openid%20profile%20offline_access`);
                expect(next.handle).toHaveBeenCalledTimes(1);
            }));

            it('should call next and not update body if - not post', fakeAsync(() => {
                // Arrange
                const next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
                let result: HttpRequest<any>;
                next.handle.and.callFake(req => {
                    result = req;
                    return of({} as HttpEvent<any>);
                });
                const request = new HttpRequest<any>('GET', '/oauth2/v2.0/token');

                currentIdpSubject.next(provider);
                flush();

                // Act
                sut.intercept(request, next).subscribe(() => {});
                flush();

                // Assert
                expect(result.body).toBe(request.body);
                expect(next.handle).toHaveBeenCalledTimes(1);
            }));

            it('should call next and not update body if - post not matching route', fakeAsync(() => {
                // Arrange
                const next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
                let result: HttpRequest<any>;
                next.handle.and.callFake(req => {
                    result = req;
                    return of({} as HttpEvent<any>);
                });
                const request = new HttpRequest<any>('POST', '/', 'params1');

                currentIdpSubject.next(provider);
                flush();

                // Act
                sut.intercept(request, next).subscribe(() => {});
                flush();

                // Assert
                expect(result.body).toBe(request.body);
                expect(next.handle).toHaveBeenCalledTimes(1);
            }));

            it('should call next and not update body if - no scope in config', fakeAsync(() => {
                // Arrange
                const next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
                let result: HttpRequest<any>;
                next.handle.and.callFake(req => {
                    result = req;
                    return of({} as HttpEvent<any>);
                });
                const request = new HttpRequest<any>('POST', '/oauth2/v2.0/token', 'params1');
                securityServiceSpy.getConfiguration.and.returnValue(of({ scope: null, secureRoutes: ['.'] }));

                currentIdpSubject.next(provider);
                flush();

                // Act
                sut.intercept(request, next).subscribe(() => {});
                flush();

                // Assert
                expect(result.body).toBe(request.body);
                expect(next.handle).toHaveBeenCalledTimes(1);
            }));

            it('should call next and not update body if - no body', fakeAsync(() => {
                // Arrange
                const next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
                let result: HttpRequest<any>;
                next.handle.and.callFake(req => {
                    result = req;
                    return of({} as HttpEvent<any>);
                });
                const request = new HttpRequest<any>('POST', '/oauth2/v2.0/token', null);

                currentIdpSubject.next(provider);
                flush();

                // Act
                sut.intercept(request, next).subscribe(() => {});
                flush();

                // Assert
                expect(result.body).toBe(request.body);
                expect(next.handle).toHaveBeenCalledTimes(1);
            }));
        });
    }

    describe(`when provider is ${IdpProviders.quickLink.toString()}`, () => {
        it('should NOT modify the request', fakeAsync(() => {
            // Arrange
            const next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
            let result: HttpRequest<any>;
            next.handle.and.callFake(req => {
                result = req;
                return of({} as HttpEvent<any>);
            });
            const request = new HttpRequest<any>('POST', '/oauth2/v2.0/token', 'params1');

            currentIdpSubject.next(IdpProviders.quickLink);
            flush();

            // Act
            sut.intercept(request, next).subscribe(() => {});
            flush();

            // Assert
            expect(result).toBe(request);
            expect(result.body).toBe(request.body);
            expect(next.handle).toHaveBeenCalledTimes(1);
        }));
    });
});
