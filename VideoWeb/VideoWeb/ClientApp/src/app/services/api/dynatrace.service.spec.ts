import { TestBed } from '@angular/core/testing';

import { DynatraceService } from './dynatrace.service';
import { RendererFactory2, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';

describe('DynatraceService', () => {
    let service: DynatraceService;
    let renderer: jasmine.SpyObj<Renderer2>;
    let rendererFactory: jasmine.SpyObj<RendererFactory2>;
    let documentMock: any;

    beforeEach(() => {
        renderer = jasmine.createSpyObj('Renderer2', ['createElement']);
        rendererFactory = jasmine.createSpyObj('RendererFactory2', ['createRenderer']);
        documentMock = {
            head: {
                appendChild: jasmine.createSpy('appendChild')
            },
            querySelectorAll: jasmine.createSpy('querySelectorAll')
        };

        renderer.createElement.and.returnValue(document.createElement('script'));
        rendererFactory.createRenderer.and.returnValue(renderer);

        TestBed.configureTestingModule({
            providers: [
                DynatraceService,
                { provide: RendererFactory2, useValue: rendererFactory },
                { provide: DOCUMENT, useValue: documentMock }
            ]
        });

        service = TestBed.inject(DynatraceService);

        // Mock the dtrum object
        (window as any).dtrum = {
            identifyUser: jasmine.createSpy('identifyUser')
        };

        renderer.createElement.calls.reset();
        documentMock.querySelectorAll.calls.reset();
    });

    afterEach(() => {
        // Clean up the mock after each test
        delete (window as any).dtrum;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should load the dynatrace rum link', () => {
        service.addDynatraceScript('dynatraceRumLink.js');
        expect(renderer.createElement).toHaveBeenCalledWith('script');
        expect(documentMock.head.appendChild).toHaveBeenCalled();
    });

    it('should inject the dynatrace user identification script if not already loaded', () => {
        spyOn(service as any, 'isUserIdentifyScriptAlreadyLoaded').and.returnValue(false);
        const appendChildSpy = documentMock.head.appendChild.and.callThrough();

        service.addUserIdentifier('user@mail.com');

        expect(renderer.createElement).toHaveBeenCalledWith('script');
        expect(appendChildSpy).toHaveBeenCalled();
    });

    it('should not inject the dynatrace user identification script if already loaded', () => {
        spyOn(service as any, 'isUserIdentifyScriptAlreadyLoaded').and.returnValue(true);
        const appendChildSpy = documentMock.head.appendChild.and.callThrough();

        service.addUserIdentifier('user@mail.com');

        expect(renderer.createElement).not.toHaveBeenCalled();
        expect(appendChildSpy).not.toHaveBeenCalled();
    });

    it('should correctly identify if user identification script is already loaded', () => {
        const scriptElement = document.createElement('script');
        scriptElement.textContent = 'dtrum.identifyUser("user@mail.com")';
        documentMock.querySelectorAll.and.returnValue([scriptElement]);

        const result = service.isUserIdentifyScriptAlreadyLoaded();
        expect(documentMock.querySelectorAll).toHaveBeenCalledWith('script');
        expect(result).toBeTrue();
    });

    it('should correctly identify if user identification script is not loaded', () => {
        documentMock.querySelectorAll.and.returnValue([]);
        const result = service.isUserIdentifyScriptAlreadyLoaded();
        expect(result).toBeFalse();
    });
});
