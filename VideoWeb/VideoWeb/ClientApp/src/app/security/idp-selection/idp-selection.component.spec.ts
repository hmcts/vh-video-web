import { Router } from '@angular/router';
import { ReturnUrlService } from '../../services/return-url.service';
import { MockAdalService } from '../../testing/mocks/MockAdalService';
import { MockLogger } from '../../testing/mocks/MockLogger';
import { IdpSelectionComponent } from './idp-selection.component';

describe('IdpSelectionComponent', () => {
    let component: IdpSelectionComponent;
    const mockAdalService = new MockAdalService();
    let adalService;
    const returnUrlService = new ReturnUrlService();
    const activatedRoute: any = { snapshot: { url: [{ path: 'foo' }], queryParams: {} } };
    let router: jasmine.SpyObj<Router>;

    beforeAll(() => {
        adalService = mockAdalService;
        router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
    });

    beforeEach(() => {
        router.navigate.calls.reset();
        component = new IdpSelectionComponent(adalService, activatedRoute, router, returnUrlService, new MockLogger());
    });

    it('should create', () => {
        expect(component).toBeTruthy();
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
        component.selectedProvider = 'vhaad';
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
        component.selectProvider('test_provider');
        expect(component.selectedProvider).toBe('test_provider');
    });

    it('should navigate on next if exists', () => {
        component.selectedProvider = 'vhaad';
        const result = component.onSubmit();
        expect(result).toBeTrue();
        expect(router.navigate).toHaveBeenCalledWith([component.identityProviders.vhaad.url]);
    });

    it('should not navigate on next if doesnt exists', () => {
        component.selectedProvider = '';
        const result = component.onSubmit();
        expect(result).toBeFalse();
        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should store return url if supplied', () => {
        spyOn(returnUrlService, 'setUrl');
        adalService.setAuthenticated(false);
        activatedRoute.snapshot.queryParams.returnUrl = '/returnPath';
        component.ngOnInit();
        expect(returnUrlService.setUrl).toHaveBeenCalledWith('/returnPath');
    });

    it('should use saved return url', () => {
        adalService.setAuthenticated(true);
        spyOn(returnUrlService, 'popUrl').and.returnValue('testurl');
        component.ngOnInit();
        expect(router.navigateByUrl).toHaveBeenCalledWith('testurl');
    });

    it('should return to root url if no return path is given', () => {
        adalService.setAuthenticated(true);
        component.ngOnInit();
        expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('should fallback to root url if return url is invalid', () => {
        spyOn(returnUrlService, 'popUrl').and.returnValue('');
        adalService.setAuthenticated(true);
        router.navigateByUrl.and.callFake(() => {
            throw new Error('Invalid URL');
        });
        component.ngOnInit();
        expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
});
