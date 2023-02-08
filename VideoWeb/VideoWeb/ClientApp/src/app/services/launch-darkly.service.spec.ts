import { TestBed } from '@angular/core/testing';
import { ConfigService } from './api/config.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { LaunchDarklyService } from './launch-darkly.service';

describe('LaunchDarklyService', () => {
    let service: LaunchDarklyService;
    const configServiceSpy = jasmine.createSpyObj('ConfigService', ['getConfig']);
    configServiceSpy.getConfig.and.returnValue({ launch_darkly_client_id: 'client_id' });

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: ConfigService, useValue: configServiceSpy }, Logger]
        });
        service = TestBed.inject(LaunchDarklyService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('LD client should be intialised', () => {
        service.initialize();
        expect(service.ldClient).toBeDefined();
    });

    it('should trigger onReady event', () => {
        spyOn(service.ldClient, 'on').and.callThrough();
        service.onReady();
        expect(service.ldClient.on).toHaveBeenCalledTimes(1);
        expect(service.ldClient.on).toHaveBeenCalledWith('ready', jasmine.any(Function));
    });

    it('should trigger onChange event', () => {
        spyOn(service.ldClient, 'on').and.callThrough();
        service.onChange();
        expect(service.ldClient.on).toHaveBeenCalledTimes(1);
        expect(service.ldClient.on).toHaveBeenCalledWith('change', jasmine.any(Function));
    });
});
