import { TestBed } from '@angular/core/testing';

import { DynatraceService } from './dynatrace.service';
import { RendererFactory2 } from '@angular/core';

describe('DynatraceService', () => {
    let service: DynatraceService;
    const renderer = jasmine.createSpyObj('Renderer2', ['createElement']);
    const rendererFactory = jasmine.createSpyObj('RendererFactory2', ['createRenderer']);

    beforeEach(() => {
        renderer.createElement.and.returnValue(document.createElement('script'));
        rendererFactory.createRenderer.and.returnValue(renderer);
        TestBed.configureTestingModule({
            providers: [DynatraceService, { provide: RendererFactory2, useValue: rendererFactory }]
        });
        service = TestBed.inject(DynatraceService);
        renderer.createElement.calls.reset();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should load the dynatrace rum link', () => {
        service.addDynatraceScript('dynatraceRumLink.js');
        expect(renderer.createElement).toHaveBeenCalledWith('script');
    });

    it('should inject the dynatrace user identification script', () => {
        service.addDynatraceScript('dynatraceRumLink.js');
        service.addUserIdentifyScript('user@mail.com');
        expect(renderer.createElement).toHaveBeenCalledWith('script');
    });
});
