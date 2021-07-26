import { HttpClientModule, HttpEvent, HttpEventType, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { fakeAsync, flush, TestBed } from '@angular/core/testing';
import { Observable, of, Subject } from 'rxjs';
import { Logger } from '../services/logging/logger-base';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';

import { AuthenticationInterceptor } from './authentication.interceptor';
import { SecurityServiceProviderService } from './authentication/security-service-provider.service';
import { ISecurityService } from './authentication/security-service.interface';
import { IdpProviders } from './idp-providers';
import { SecurityConfigSetupService } from './security-config-setup.service';

describe('AuthenticationInterceptor', () => {
    let sut: AuthenticationInterceptor;
    let securityConfigSetupServiceSpy: jasmine.SpyObj<SecurityConfigSetupService>;
    let currentIdpSubject: Subject<IdpProviders>;
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProviderService>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    beforeEach(() => {
        securityConfigSetupServiceSpy = jasmine.createSpyObj<SecurityConfigSetupService>('SecurityConfigSetupService', [], ['currentIdp$']);
        currentIdpSubject = new Subject<IdpProviders>();
        getSpiedPropertyGetter(securityConfigSetupServiceSpy, 'currentIdp$').and.returnValue(currentIdpSubject);

        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProviderService>('SecurityServiceProviderService', [
            'getSecurityService'
        ]);
        loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['warn', 'debug']);

        TestBed.configureTestingModule({
            providers: [
                AuthenticationInterceptor,
                { provide: SecurityConfigSetupService, useValue: securityConfigSetupServiceSpy },
                { provide: SecurityServiceProviderService, useValue: securityServiceProviderServiceSpy },
                { provide: Logger, useValue: loggerSpy }
            ],
            imports: [HttpClientModule]
        });

        sut = TestBed.inject(AuthenticationInterceptor);
    });

    describe('intercept', () => {
        it('should add token to requests for magic link participants', fakeAsync(() => {
            // Arrange
            const expectedToken = 'token';
            const expectedBearerToken = `Bearer ${expectedToken}`;
            const expectedContentType = 'application/json';

            const securityServiceSpy = jasmine.createSpyObj<ISecurityService>('ISecurityService', ['getToken']);
            securityServiceSpy.getToken.and.returnValue(expectedToken);
            securityServiceProviderServiceSpy.getSecurityService.and.returnValue(securityServiceSpy);

            currentIdpSubject.next(IdpProviders.magicLink);
            flush();

            const request = new HttpRequest('GET', 'testUrl');
            let sentRequest: HttpRequest<any> = null;

            const nextHandler: HttpHandler = {
                handle: (request: HttpRequest<any>): Observable<HttpEvent<any>> => {
                    sentRequest = request;
                    return of(new HttpResponse());
                }
            };

            // Act
            sut.intercept(request, nextHandler);

            // Assert
            expect(sentRequest).not.toBeNull();
            expect(sentRequest.headers.has('Authorization')).toBeTrue();
            expect(sentRequest.headers.get('Authorization')).toBe(expectedBearerToken);
            expect(sentRequest.headers.has('Content-Type')).toBeTrue();
            expect(sentRequest.headers.get('Content-Type')).toBe(expectedContentType);
        }));

        it('should NOT add token to requests for vhaad participants', fakeAsync(() => {
            // Arrange
            currentIdpSubject.next(IdpProviders.vhaad);
            flush();

            const request = new HttpRequest('GET', 'testUrl');
            let sentRequest: HttpRequest<any> = null;

            const nextHandler: HttpHandler = {
                handle: (request: HttpRequest<any>): Observable<HttpEvent<any>> => {
                    sentRequest = request;
                    return of(new HttpResponse());
                }
            };

            // Act
            sut.intercept(request, nextHandler);

            // Assert
            expect(sentRequest).toBe(request);
        }));

        it('should NOT add token to requests for ejud participants', fakeAsync(() => {
            // Arrange
            currentIdpSubject.next(IdpProviders.ejud);
            flush();

            const request = new HttpRequest('GET', 'testUrl');
            let sentRequest: HttpRequest<any> = null;

            const nextHandler: HttpHandler = {
                handle: (request: HttpRequest<any>): Observable<HttpEvent<any>> => {
                    sentRequest = request;
                    return of(new HttpResponse());
                }
            };

            // Act
            sut.intercept(request, nextHandler);

            // Assert
            expect(sentRequest).toBe(request);
        }));

        it('should NOT add token to requests if the currentIdp is falsey', fakeAsync(() => {
            // Arrange
            const request = new HttpRequest('GET', 'testUrl');
            let sentRequest: HttpRequest<any> = null;

            const nextHandler: HttpHandler = {
                handle: (request: HttpRequest<any>): Observable<HttpEvent<any>> => {
                    sentRequest = request;
                    return of(new HttpResponse());
                }
            };

            // Act
            sut.intercept(request, nextHandler);

            // Assert
            expect(sentRequest).toBe(request);
        }));
    });
});
