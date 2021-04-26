import { Router } from '@angular/router';
import { MockOidcSecurityService } from 'src/app/testing/mocks/mock-oidc-security.service';
import { OidcConfigSetupService } from '../oidc-config-setup.service';
import { VhSignInComponent } from './vh-sign-in.component';

describe('VhSignInComponent', () => {
    let component: VhSignInComponent;
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
        component = new VhSignInComponent(router, oidcSecurityService);
    });
});
