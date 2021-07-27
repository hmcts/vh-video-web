import { HttpEvent, HttpHandler, HttpRequest } from '@angular/common/http';
import { fakeAsync, flush } from '@angular/core/testing';
import { PublicConfiguration } from 'angular-auth-oidc-client';
import { of, Subject } from 'rxjs';
import { Logger } from '../services/logging/logger-base';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';
import { SecurityServiceProviderService } from './authentication/security-service-provider.service';
import { ISecurityService } from './authentication/security-service.interface';
import { IdpProviders } from './idp-providers';
import { RefreshTokenParameterInterceptor } from './refresh-token-parameter.interceptor';

describe('RefreshTokenParameterInterceptor', () => {
    let sut: RefreshTokenParameterInterceptor;
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProviderService>;
    let currentIdpSubject: Subject<IdpProviders>;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    beforeEach(() => {
        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProviderService>(
            'SecurityServiceProviderService',
            ['getSecurityService'],
            ['currentIdp$']
        );

        currentIdpSubject = new Subject<IdpProviders>();
        securityServiceSpy = jasmine.createSpyObj<ISecurityService>('ISecurityService', [], ['configuration']);

        getSpiedPropertyGetter(securityServiceSpy, 'configuration').and.returnValue({
            configuration: {
                scope: 'openid profile offline_access',
                secureRoutes: ['.']
            }
        } as PublicConfiguration);

        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentIdp$').and.returnValue(currentIdpSubject.asObservable());
        securityServiceProviderServiceSpy.getSecurityService.and.returnValue(securityServiceSpy);

        loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['debug']);

        sut = new RefreshTokenParameterInterceptor(securityServiceProviderServiceSpy, loggerSpy);
    });

    for (const provider of [IdpProviders.ejud, IdpProviders.vhaad]) {
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
                getSpiedPropertyGetter(securityServiceSpy, 'configuration').and.returnValue({
                    configuration: {
                        scope: null
                    }
                } as PublicConfiguration);

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

    describe(`when provider is ${IdpProviders.magicLink.toString()}`, () => {
        it('should NOT modify the request', fakeAsync(() => {
            // Arrange
            const next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
            let result: HttpRequest<any>;
            next.handle.and.callFake(req => {
                result = req;
                return of({} as HttpEvent<any>);
            });
            const request = new HttpRequest<any>('POST', '/oauth2/v2.0/token', 'params1');

            currentIdpSubject.next(IdpProviders.magicLink);
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
