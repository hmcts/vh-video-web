import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ConfigService } from './api/config.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { FEATURE_FLAGS, LaunchDarklyService } from './launch-darkly.service';
import { LDClient, LDFlagSet } from 'launchdarkly-js-client-sdk';
import { of } from 'rxjs';

describe('LaunchDarklyService', () => {
    let service: LaunchDarklyService;
    const configServiceSpy = jasmine.createSpyObj('ConfigService', ['getClientSettings']);
    configServiceSpy.getClientSettings.and.returnValue(
        of({ launch_darkly_client_id: 'client_id', vh_idp_settings: { redirect_uri: 'unittest' } })
    );
    const ldClientSpy = jasmine.createSpyObj<LDClient>('LDClient', ['waitUntilReady', 'allFlags', 'on', 'variation', 'close']);

    beforeEach(() => {
        // default to no flags
        ldClientSpy.on.and.returnValue();
        TestBed.configureTestingModule({
            providers: [{ provide: ConfigService, useValue: configServiceSpy }, Logger]
        });
        service = TestBed.inject(LaunchDarklyService);
    });

    it('LD client should be intialised', () => {
        service.vhInitialize();
        expect(service.client).toBeDefined();
    });

    it('should close client onDestroy', () => {
        ldClientSpy.close.calls.reset();
        service.client = ldClientSpy;

        service.ngOnDestroy();

        expect(ldClientSpy.close).toHaveBeenCalled();
    });

    it('should return a given flag', fakeAsync(() => {
        service.client = ldClientSpy;
        const flagKey = FEATURE_FLAGS.dom1SignIn;
        const keyParam = `change:${flagKey}`;
        const allFlags: LDFlagSet = { [flagKey]: true };
        ldClientSpy.allFlags.and.returnValue(allFlags);

        ldClientSpy.on.withArgs(keyParam, jasmine.anything()).and.returnValue();
        ldClientSpy.waitUntilReady.and.returnValue(Promise.resolve());
        ldClientSpy.variation.withArgs(flagKey, jasmine.any(Boolean)).and.returnValue(true);

        service.loadAllFlagsAndSetupSubscriptions();

        let result: boolean;
        service.getFlag<boolean>(flagKey).subscribe(val => (result = val));
        tick();

        expect(result).toBe(true);
    }));

    it('should wait for flags to be loaded before returning requested flag', fakeAsync(() => {
        // Arrange
        service.client = ldClientSpy;
        const flagKey = FEATURE_FLAGS.dom1SignIn;
        const keyParam = `change:${flagKey}`;
        const allFlags: LDFlagSet = { [flagKey]: true };
        ldClientSpy.allFlags.and.returnValue(allFlags);
        ldClientSpy.on.withArgs(keyParam, jasmine.anything()).and.returnValue();
        ldClientSpy.variation.withArgs(flagKey, jasmine.any(Boolean)).and.returnValue(true);
        let result: boolean;

        // Act
        service.getFlag<boolean>(flagKey).subscribe(val => (result = val));
        service.loadAllFlagsAndSetupSubscriptions();
        ldClientSpy.waitUntilReady.and.returnValue(Promise.resolve());
        tick();

        // Assert
        expect(result).toBe(true);
    }));
});
