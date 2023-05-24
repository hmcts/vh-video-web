import { Router } from '@angular/router';
import { of } from 'rxjs';
import { pageUrls } from '../shared/page-url.constants';
import { HomeComponent } from './home.component';
import { SecurityServiceProvider } from '../security/authentication/security-provider.service';
import { ISecurityService } from '../security/authentication/security-service.interface';
import { IdpProviders } from '../security/idp-providers';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';

describe('HomeComponent', () => {
    let component: HomeComponent;
    let routerSpy: jasmine.SpyObj<Router>;
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProvider>;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;

    beforeAll(() => {
        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProvider>(
            'SecurityServiceProviderService',
            [],
            ['currentSecurityService$', 'currentIdp$']
        );

        securityServiceSpy = jasmine.createSpyObj<ISecurityService>('ISecurityService', ['isAuthenticated']);
    });

    beforeEach(() => {
        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentSecurityService$').and.returnValue(of(securityServiceSpy));
        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentIdp$').and.returnValue(of(IdpProviders.vhaad));

        component = new HomeComponent(securityServiceProviderServiceSpy, routerSpy);
        routerSpy.navigate.and.callFake(() => Promise.resolve(true));
        routerSpy.navigate.calls.reset();
    });

    it('should go to navigator when user is authenticated', async () => {
        securityServiceSpy.isAuthenticated.and.returnValue(of(true));
        component.ngOnInit();
        expect(routerSpy.navigate).toHaveBeenCalledWith([`/${pageUrls.Navigator}`]);
    });

    it('should not go to navigator when user is not authenticated', async () => {
        securityServiceSpy.isAuthenticated.and.returnValue(of(false));
        component.ngOnInit();
        expect(routerSpy.navigate).not.toHaveBeenCalledWith([`/${pageUrls.Navigator}`]);
    });
});
