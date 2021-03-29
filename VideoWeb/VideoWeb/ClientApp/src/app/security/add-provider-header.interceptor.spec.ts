import { HttpEvent, HttpHandler, HttpRequest } from '@angular/common/http';
import { of } from 'rxjs';
import { MockLogger } from '../testing/mocks/mock-logger';
import { MockOidcSecurityService } from '../testing/mocks/mock-oidc-security.service';
import { AddProviderHeaderInterceptor } from './add-provider-header.interceptor';
import { OidcConfigSetupService } from './oidc-config-setup.service';

describe('AddProviderHeaderInterceptor', () => {
    let sut: AddProviderHeaderInterceptor;
    let oidcConfigSetupServiceSpy: jasmine.SpyObj<OidcConfigSetupService>;
    let mockOidcSecurityService: MockOidcSecurityService;

    beforeEach(() => {
        mockOidcSecurityService = new MockOidcSecurityService();
        oidcConfigSetupServiceSpy = jasmine.createSpyObj<OidcConfigSetupService>('OidcConfigSetupService', ['getIdp']);
        oidcConfigSetupServiceSpy.getIdp.and.returnValue('testIdp');
        sut = new AddProviderHeaderInterceptor(mockOidcSecurityService as any, new MockLogger(), oidcConfigSetupServiceSpy);
    });

    it('should call next with oidc provider header if config loaded and route matches', async () => {
        // Arrange
        const next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
        let result: HttpRequest<any>;
        next.handle.and.callFake(req => {
            result = req;
            return of({} as HttpEvent<any>);
        });
        const request = new HttpRequest<any>('POST', './profile', 'params1');

        // Act
        await sut.intercept(request, next).toPromise();

        // Assert
        expect(result.body).toBe(request.body);
        expect(result.headers.get('oidc-provider')).toBe('testIdp');
        expect(next.handle).toHaveBeenCalledTimes(1);
    });

    it('should call next with original body and headers if config not loaded', async () => {
        // Arrange
        mockOidcSecurityService.configuration = null;
        const next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
        let result: HttpRequest<any>;
        next.handle.and.callFake(req => {
            result = req;
            return of({} as HttpEvent<any>);
        });
        const request = new HttpRequest<any>('POST', './profile', 'params1');

        // Act
        await sut.intercept(request, next).toPromise();

        // Assert
        expect(result.body).toBe(request.body);
        expect(result.headers).toBe(request.headers);
        expect(next.handle).toHaveBeenCalledTimes(1);
    });

    it('should call next with original body and headers if route doesnt match', async () => {
        // Arrange
        const next = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
        let result: HttpRequest<any>;
        next.handle.and.callFake(req => {
            result = req;
            return of({} as HttpEvent<any>);
        });
        const request = new HttpRequest<any>('POST', 'InvalidRoute', 'params1');

        // Act
        await sut.intercept(request, next).toPromise();

        // Assert
        expect(result.body).toBe(request.body);
        expect(result.headers).toBe(request.headers);
        expect(next.handle).toHaveBeenCalledTimes(1);
    });
});
