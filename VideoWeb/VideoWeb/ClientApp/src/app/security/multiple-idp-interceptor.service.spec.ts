import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { MultipleIdpInterceptorService } from './multiple-idp-interceptor.service';
import { SecurityServiceProvider } from './authentication/security-provider.service';
import { Observable, Subject, of } from 'rxjs';
import { IdpProviders } from './idp-providers';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';
import { ISecurityService } from './authentication/security-service.interface';
import { HttpEvent, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';

describe('MultipleIdpInterceptorService', () => {
    let service: MultipleIdpInterceptorService;
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProvider>;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;
    let currentIdpSubject: Subject<IdpProviders>;

    beforeEach(() => {
        currentIdpSubject = new Subject<IdpProviders>();
        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProvider>(
            'SecurityServiceProviderService',
            [],
            ['currentSecurityService$', 'currentIdp$']
        );
        securityServiceSpy = jasmine.createSpyObj<ISecurityService>('ISecurityService', ['getAccessToken']);

        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentSecurityService$').and.returnValue(of(securityServiceSpy));
        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentIdp$').and.returnValue(currentIdpSubject.asObservable());

        TestBed.configureTestingModule({
            providers: [{ provide: SecurityServiceProvider, useValue: securityServiceProviderServiceSpy }]
        });
        service = TestBed.inject(MultipleIdpInterceptorService);
    });

    describe('intercept', () => {
        it('should not add token to requests for quick link participants', fakeAsync(() => {
            // arrange
            currentIdpSubject.next(IdpProviders.quickLink);
            const request = new HttpRequest('GET', 'testUrl');
            let sentRequest: HttpRequest<any> = null;

            const nextHandler: HttpHandler = {
                handle: (requestToHandle: HttpRequest<any>): Observable<HttpEvent<any>> => {
                    sentRequest = requestToHandle;
                    return of(new HttpResponse());
                }
            };

            // act
            service.intercept(request, nextHandler).subscribe();
            tick();

            // assert
            expect(sentRequest).toBe(request);
        }));

        it('should add token to requests for non-quicklink participants', fakeAsync(() => {
            // arrange
            currentIdpSubject.next(IdpProviders.vhaad);
            const expectedToken = 'token';
            securityServiceSpy.getAccessToken.and.returnValue(of(expectedToken));
            const expectedBearerToken = `Bearer ${expectedToken}`;
            const expectedContentType = 'application/json';

            const request = new HttpRequest('GET', 'testUrl');
            let sentRequest: HttpRequest<any> = null;

            const nextHandler: HttpHandler = {
                handle: (requestToHandle: HttpRequest<any>): Observable<HttpEvent<any>> => {
                    sentRequest = requestToHandle;
                    return of(new HttpResponse());
                }
            };

            // act
            service.intercept(request, nextHandler).subscribe();
            tick();

            // assert
            expect(sentRequest).not.toBeNull();
            expect(sentRequest.headers.has('Authorization')).toBeTrue();
            expect(sentRequest.headers.get('Authorization')).toBe(expectedBearerToken);
        }));
    });
});
