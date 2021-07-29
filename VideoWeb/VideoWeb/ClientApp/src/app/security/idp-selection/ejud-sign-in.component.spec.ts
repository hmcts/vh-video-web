import { Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { IdpProviders } from '../idp-providers';
import { SecurityConfigSetupService } from '../security-config-setup.service';
import { EjudSignInComponent } from './ejud-sign-in.component';

describe('EjudSignInComponent', () => {
    let component: EjudSignInComponent;
    let router: jasmine.SpyObj<Router>;
    let securityConfigSetupServiceSpy: jasmine.SpyObj<SecurityConfigSetupService>;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
        securityConfigSetupServiceSpy = jasmine.createSpyObj<SecurityConfigSetupService>('SecurityConfigSetupService', ['setIdp']);
    });

    beforeEach(async () => {
        router.navigate.calls.reset();
        component = new EjudSignInComponent(router, securityConfigSetupServiceSpy);
    });

    it('should go to login when called', async () => {
        component.ngOnInit();
        expect(securityConfigSetupServiceSpy.setIdp).toHaveBeenCalledOnceWith(IdpProviders.ejud);
        expect(router.navigate).toHaveBeenCalledOnceWith([`/${pageUrls.Login}`]);
    });
});
