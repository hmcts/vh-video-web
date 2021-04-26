import { Router } from '@angular/router';
import { MockOidcSecurityService } from 'src/app/testing/mocks/mock-oidc-security.service';
import { OidcConfigSetupService } from '../oidc-config-setup.service';
import { EjudSignInComponent } from './ejud-sign-in.component';

describe('EjudSignInComponent', () => {
    let component: EjudSignInComponent;
    const mockOidcSecurityService = new MockOidcSecurityService();
    let oidcSecurityService;
    let router: jasmine.SpyObj<Router>;
    let oidcConfigSetupServiceSpy: jasmine.SpyObj<OidcConfigSetupService>;

    beforeAll(() => {
        oidcSecurityService = mockOidcSecurityService;
        router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
        oidcConfigSetupServiceSpy = jasmine.createSpyObj<OidcConfigSetupService>('OidcConfigSetupService', ['setIdp']);
    });

    beforeEach(async () => {
        router.navigate.calls.reset();
        component = new EjudSignInComponent(router, oidcSecurityService);
    });
});
