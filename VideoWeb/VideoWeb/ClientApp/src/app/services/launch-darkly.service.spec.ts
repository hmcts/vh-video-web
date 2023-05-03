import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ConfigService } from './api/config.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { FEATURE_FLAGS, LaunchDarklyService } from './launch-darkly.service';
import { LDClient, LDFlagSet } from 'launchdarkly-js-client-sdk';

describe('LaunchDarklyService', () => {
    let service: LaunchDarklyService;
    const configServiceSpy = jasmine.createSpyObj('ConfigService', ['getConfig']);
    configServiceSpy.getConfig.and.returnValue({ launch_darkly_client_id: 'client_id', vh_idp_settings: { redirect_uri: 'unittest' } });
    const ldClientSpy = jasmine.createSpyObj<LDClient>('LDClient', ['waitUntilReady', 'allFlags', 'on', 'variation', 'close']);

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: ConfigService, useValue: configServiceSpy }, Logger]
        });
        service = TestBed.inject(LaunchDarklyService);
    });

    it('LD client should be intialised', () => {
        service.initialize();
        expect(service.client).toBeDefined();
    });

    it('should close client onDestroy', () => {
        ldClientSpy.close.calls.reset();
        service.client = ldClientSpy;

        service.ngOnDestroy();

        expect(ldClientSpy.close).toHaveBeenCalled();
    });

    it('should return all flags when client is ready', fakeAsync(() => {
        service.client = ldClientSpy;
        const allFlags = { 'vho-work-allocation': true, dom1: false } as LDFlagSet;
        ldClientSpy.allFlags.and.returnValue(allFlags);
        ldClientSpy.waitUntilReady.and.returnValue(Promise.resolve());

        let flags: LDFlagSet;
        service.flagChange.subscribe(values => (flags = values));
        tick();

        expect(flags).toEqual(allFlags);
    }));

    it('should return a given flag', fakeAsync(() => {
        service.client = ldClientSpy;
        const flagKey = FEATURE_FLAGS.ejudiciarySignIn;
        const keyParam = `change:${flagKey}`;
        ldClientSpy.on.withArgs(keyParam, jasmine.anything()).and.returnValue();
        ldClientSpy.waitUntilReady.and.returnValue(Promise.resolve());
        ldClientSpy.variation.withArgs(flagKey, jasmine.any(Boolean)).and.returnValue(true);

        let result: boolean;
        service.getFlag(flagKey).subscribe(val => (result = val));
        tick();

        expect(result).toBe(true);
    }));
});
