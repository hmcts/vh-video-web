import { Dom1SignInComponent } from './dom1-sign-in.component';
import { Router } from '@angular/router';
import { SecurityConfigSetupService } from '../security-config-setup.service';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { IdpProviders } from '../idp-providers';

describe('Dom1SignInComponent', () => {
    let component: Dom1SignInComponent;
    let router: jasmine.SpyObj<Router>;
    let securityConfigSetupServiceSpy: jasmine.SpyObj<SecurityConfigSetupService>;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
        securityConfigSetupServiceSpy = jasmine.createSpyObj<SecurityConfigSetupService>('SecurityConfigSetupService', ['setIdp']);
    });

    beforeEach(() => {
        router.navigate.calls.reset();
        component = new Dom1SignInComponent(router, securityConfigSetupServiceSpy);
    });

    it('should go to login when called', () => {
        component.ngOnInit();
        expect(securityConfigSetupServiceSpy.setIdp).toHaveBeenCalledOnceWith(IdpProviders.dom1);
        expect(router.navigate).toHaveBeenCalledOnceWith([`/${pageUrls.Login}`]);
    });
});
