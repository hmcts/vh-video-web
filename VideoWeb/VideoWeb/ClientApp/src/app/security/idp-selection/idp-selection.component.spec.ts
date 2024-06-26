import { Router } from '@angular/router';
import { MockLogger } from '../../testing/mocks/mock-logger';
import { IdpSelectionComponent } from './idp-selection.component';
import { ConfigService } from 'src/app/services/api/config.service';
import { of } from 'rxjs';
import { SecurityConfigSetupService } from '../security-config-setup.service';
import { IdpProviders } from '../idp-providers';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { fakeAsync, tick } from '@angular/core/testing';
import { pageUrls } from 'src/app/shared/page-url.constants';

describe('IdpSelectionComponent', () => {
    let component: IdpSelectionComponent;

    let router: jasmine.SpyObj<Router>;
    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let oidcConfigSetupServiceSpy: jasmine.SpyObj<SecurityConfigSetupService>;
    let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings']);
        oidcConfigSetupServiceSpy = jasmine.createSpyObj<SecurityConfigSetupService>('OidcConfigSetupService', ['setIdp']);
        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
    });

    beforeEach(() => {
        router.navigate.calls.reset();
        component = new IdpSelectionComponent(router, new MockLogger(), oidcConfigSetupServiceSpy, launchDarklyServiceSpy);
        configServiceSpy.getClientSettings.and.returnValue(of(null));
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.dom1SignIn).and.returnValue(of(false));
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

    it('should getProviders including ejud', fakeAsync(() => {
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

        expect(providers.length).toBe(2);
        expect(providers[0]).toBe('vhaad');
    }));

    it('should getProviders including ejud when dom1 feature flag is on', fakeAsync(() => {
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.dom1SignIn).and.returnValue(of(true));
        component.ngOnInit();
        tick();

        const providers = component.getProviders();

        expect(providers.length).toBe(3);
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
        component.ngOnInit();
        component.selectedProvider = IdpProviders.vhaad;
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
