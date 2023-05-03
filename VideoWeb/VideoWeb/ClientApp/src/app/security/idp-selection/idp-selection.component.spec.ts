import { Router } from '@angular/router';
import { MockOidcSecurityService } from '../../testing/mocks/mock-oidc-security.service';
import { MockLogger } from '../../testing/mocks/mock-logger';
import { IdpSelectionComponent } from './idp-selection.component';

import { SecurityConfigSetupService } from '../security-config-setup.service';
import { IdpProviders } from '../idp-providers';
import { LaunchDarklyService, FEATURE_FLAGS } from 'src/app/services/launch-darkly.service';
import { fakeAsync, tick } from '@angular/core/testing';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { Subject, of } from 'rxjs';

describe('IdpSelectionComponent', () => {
    let component: IdpSelectionComponent;
    const mockOidcSecurityService = new MockOidcSecurityService();
    let oidcSecurityService;
    let router: jasmine.SpyObj<Router>;
    let oidcConfigSetupServiceSpy: jasmine.SpyObj<SecurityConfigSetupService>;
    let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;

    beforeAll(() => {
        oidcSecurityService = mockOidcSecurityService;
        router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
        oidcConfigSetupServiceSpy = jasmine.createSpyObj<SecurityConfigSetupService>('OidcConfigSetupService', ['setIdp']);
        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
    });

    beforeEach(() => {
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.ejudiciarySignIn).and.returnValue(of(false));
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.dom1SignIn).and.returnValue(of(false));
        router.navigate.calls.reset();
        component = new IdpSelectionComponent(router, new MockLogger(), oidcConfigSetupServiceSpy, launchDarklyServiceSpy);
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

    it('should getProviders should return providers without edjud when feature flag is off', fakeAsync(() => {
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.ejudiciarySignIn).and.returnValue(of(false));
        component.ngOnInit();
        tick();

        const providers = component.getProviders();
        console.log(component);
        expect(providers.length).toBe(1);
        expect(providers[0]).toBe('vhaad');
    }));

    it('should getProviders including ejud when ejud feature flag is on', fakeAsync(() => {
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.ejudiciarySignIn).and.returnValue(of(true));
        component.ngOnInit();
        tick();

        const providers = component.getProviders();

        expect(providers.length).toBe(2);
        expect(providers.includes('vhaad')).toBeTruthy();
        expect(providers.includes('ejud')).toBeTruthy();
    }));

    it('should getProviders should return providers without dom1 when feature flag is off', fakeAsync(() => {
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.dom1SignIn).and.returnValue(of(false));
        component.ngOnInit();
        tick();

        const providers = component.getProviders();
        console.log(component);
        expect(providers.length).toBe(1);
        expect(providers[0]).toBe(IdpProviders.vhaad);
    }));

    it('should getProviders including dom1 when dom1 feature flag is on', fakeAsync(() => {
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.dom1SignIn).and.returnValue(of(true));
        component.ngOnInit();
        tick();

        const providers = component.getProviders();

        expect(providers.length).toBe(2);
        expect(providers.includes('vhaad')).toBeTruthy();
        expect(providers.includes('dom1')).toBeTruthy();
    }));

    it('should set selected provider', () => {
        component.selectedProvider = null;
        component.selectProvider(IdpProviders.ejud);
        expect(component.selectedProvider).toBe(IdpProviders.ejud);
    });

    it('should navigate on next if exists', () => {
        const expectedUrl = '/' + pageUrls.Login;
        component.selectedProvider = IdpProviders.vhaad;
        component.idpSelectorModel.addIdp(IdpProviders.vhaad, expectedUrl);

        const result = component.onSubmit();
        expect(result).toBeTrue();
        expect(router.navigate).toHaveBeenCalledWith([expectedUrl]);
    });

    it('should not navigate on next if doesnt exists', () => {
        component.selectedProvider = null;
        const result = component.onSubmit();
        expect(result).toBeFalse();
        expect(router.navigate).not.toHaveBeenCalled();
    });
});
