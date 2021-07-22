import { Router } from '@angular/router';
import { MockOidcSecurityService } from '../../testing/mocks/mock-oidc-security.service';
import { MockLogger } from '../../testing/mocks/mock-logger';
import { IdpSelectionComponent } from './idp-selection.component';
import { ConfigService } from 'src/app/services/api/config.service';
import { of } from 'rxjs';
import { SecurityConfigSetupService } from '../security-config-setup.service';
import { IdpProviders } from '../security-providers';

describe('IdpSelectionComponent', () => {
    let component: IdpSelectionComponent;
    const mockOidcSecurityService = new MockOidcSecurityService();
    let oidcSecurityService;
    let router: jasmine.SpyObj<Router>;
    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let oidcConfigSetupServiceSpy: jasmine.SpyObj<SecurityConfigSetupService>;

    beforeAll(() => {
        oidcSecurityService = mockOidcSecurityService;
        router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings']);
        oidcConfigSetupServiceSpy = jasmine.createSpyObj<SecurityConfigSetupService>('OidcConfigSetupService', ['setIdp']);
    });

    beforeEach(() => {
        router.navigate.calls.reset();
        component = new IdpSelectionComponent(router, new MockLogger(), oidcConfigSetupServiceSpy);
        configServiceSpy.getClientSettings.and.returnValue(of(null));
    });

    it('should show error should be false if not submitted', () => {
        component.selectedProvider = null;
        expect(component.showError()).toBeFalse();
    });

    it('should show error if submitted no provider selected', () => {
        component.selectedProvider = null;
        const result = component.onSubmit();
        expect(result).toBeFalse();
        expect(component.showError()).toBeTrue();
    });

    it('should show error should reset if selection made', () => {
        component.selectedProvider = null;
        const result = component.onSubmit();
        expect(result).toBeFalse();
        component.selectedProvider = IdpProviders.vhaad;
        expect(component.showError()).toBeFalse();
    });

    it('should getProviders should return providers', () => {
        const providers = component.getProviders();
        expect(providers.length).toBe(2);
        expect(providers[0]).toBe('ejud');
        expect(providers[1]).toBe('vhaad');
    });

    it('should set selected provider', () => {
        component.selectedProvider = null;
        component.selectProvider(IdpProviders.ejud);
        expect(component.selectedProvider).toBe(IdpProviders.ejud);
    });

    it('should navigate on next if exists', () => {
        component.selectedProvider = IdpProviders.vhaad;
        const result = component.onSubmit();
        expect(result).toBeTrue();
        expect(router.navigate).toHaveBeenCalledWith([component.identityProviders[IdpProviders.vhaad].url]);
    });

    it('should not navigate on next if doesnt exists', () => {
        component.selectedProvider = null;
        const result = component.onSubmit();
        expect(result).toBeFalse();
        expect(router.navigate).not.toHaveBeenCalled();
    });
});
