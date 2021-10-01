import { Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { SecurityConfigSetupService } from '../security-config-setup.service';
import { VhSignInComponent } from './vh-sign-in.component';

describe('VhSignInComponent', () => {
    let component: VhSignInComponent;
    let router: jasmine.SpyObj<Router>;
    let securityConfigSetupServiceSpy: jasmine.SpyObj<SecurityConfigSetupService>;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
        securityConfigSetupServiceSpy = jasmine.createSpyObj<SecurityConfigSetupService>('SecurityConfigSetupService', ['setIdp']);
    });

    beforeEach(async () => {
        router.navigate.calls.reset();
        component = new VhSignInComponent(router, securityConfigSetupServiceSpy);
    });

    it('should go to login when called', async () => {
        component.ngOnInit();
        expect(securityConfigSetupServiceSpy.setIdp).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith([`/${pageUrls.Login}`]);
    });
});
