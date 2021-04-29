import { Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { OidcConfigSetupService } from '../oidc-config-setup.service';
import { EjudSignInComponent } from './ejud-sign-in.component';

describe('EjudSignInComponent', () => {
    let component: EjudSignInComponent;
    let router: jasmine.SpyObj<Router>;
    let oidcConfigSetupServiceSpy: jasmine.SpyObj<OidcConfigSetupService>;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
        oidcConfigSetupServiceSpy = jasmine.createSpyObj<OidcConfigSetupService>('OidcConfigSetupService', ['setIdp']);
    });

    beforeEach(async () => {
        router.navigate.calls.reset();
        component = new EjudSignInComponent(router, oidcConfigSetupServiceSpy);
    });

    it('should go to login when called', async () => {
        component.ngOnInit();
        expect(oidcConfigSetupServiceSpy.setIdp).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith([`/${pageUrls.Login}`]);
    });
});
