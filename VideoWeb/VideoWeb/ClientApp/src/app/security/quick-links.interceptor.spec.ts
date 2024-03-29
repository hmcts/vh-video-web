import { HttpClientModule, HttpEvent, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { Observable, of, Subject } from 'rxjs';
import { Logger } from '../services/logging/logger-base';

import { QuickLinksInterceptor } from './quick-links.interceptor';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { ISecurityService } from './authentication/security-service.interface';
import { IdpProviders } from './idp-providers';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';

describe('QuickLinksInterceptor', () => {
    let sut: QuickLinksInterceptor;
    let currentIdpSubject: Subject<IdpProviders>;
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProvider>;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    beforeEach(() => {
        securityServiceSpy = jasmine.createSpyObj<ISecurityService>('ISecurityService', ['getAccessToken']);
        currentIdpSubject = new Subject<IdpProviders>();

        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProvider>(
            'SecurityServiceProviderService',
            [],
            [, 'currentSecurityService$', 'currentIdp$']
        );
        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentSecurityService$').and.returnValue(of(securityServiceSpy));
        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentIdp$').and.returnValue(currentIdpSubject.asObservable());
        loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['warn', 'debug']);

        TestBed.configureTestingModule({
            providers: [
                QuickLinksInterceptor,

                { provide: SecurityServiceProvider, useValue: securityServiceProviderServiceSpy },
                { provide: Logger, useValue: loggerSpy }
            ],
            imports: [HttpClientModule]
        });

        sut = TestBed.inject(QuickLinksInterceptor);
    });

    describe('intercept', () => {
        it('should add token to requests for quick link participants', fakeAsync(() => {
            // Arrange
            const expectedToken = 'token';
            const expectedBearerToken = `Bearer ${expectedToken}`;
            const expectedContentType = 'application/json';

            securityServiceSpy.getAccessToken.and.returnValue(of(expectedToken));

            currentIdpSubject.next(IdpProviders.quickLink);
            flush();

            const request = new HttpRequest('GET', 'testUrl');
            let sentRequest: HttpRequest<any> = null;

            const nextHandler: HttpHandler = {
                handle: (requestToHandle: HttpRequest<any>): Observable<HttpEvent<any>> => {
                    sentRequest = requestToHandle;
                    return of(new HttpResponse());
                }
            };

            // Act
            sut.intercept(request, nextHandler).subscribe();
            tick();

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
                handle: (requestToHandle: HttpRequest<any>): Observable<HttpEvent<any>> => {
                    sentRequest = requestToHandle;
                    return of(new HttpResponse());
                }
            };

            // Act
            sut.intercept(request, nextHandler).subscribe();
            tick();

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
                handle: (requestToHandle: HttpRequest<any>): Observable<HttpEvent<any>> => {
                    sentRequest = requestToHandle;
                    return of(new HttpResponse());
                }
            };

            // Act
            sut.intercept(request, nextHandler).subscribe();
            tick();

            // Assert
            expect(sentRequest).toBe(request);
        }));

        it('should NOT add token to requests if the currentIdp is falsey', fakeAsync(() => {
            // Arrange
            const request = new HttpRequest('GET', 'testUrl');
            let sentRequest: HttpRequest<any> = null;

            const nextHandler: HttpHandler = {
                handle: (requestToHandle: HttpRequest<any>): Observable<HttpEvent<any>> => {
                    sentRequest = requestToHandle;
                    return of(new HttpResponse());
                }
            };

            // Act
            sut.intercept(request, nextHandler).subscribe();
            tick();

            // Assert
            expect(sentRequest).toBe(request);
        }));
    });
});
