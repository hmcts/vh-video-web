import { fakeAsync, flush, TestBed } from '@angular/core/testing';
import { SupplierClientService } from './supplier-client.service';
import { RendererFactory2 } from '@angular/core';
import { Supplier } from '../clients/api-client';
import { FEATURE_FLAGS, LaunchDarklyService } from '../launch-darkly.service';
import { Subject } from 'rxjs';

describe('SupplierClientService', () => {
    let service: SupplierClientService;
    let launchDarklyService: jasmine.SpyObj<LaunchDarklyService>;
    let latestPexipFlagSubject: Subject<boolean>;
    const renderer = jasmine.createSpyObj('Renderer2', ['createElement', 'appendChild', 'removeChild']);
    const rendererFactory = jasmine.createSpyObj('RendererFactory2', ['createRenderer']);

    beforeEach(() => {
        launchDarklyService = jasmine.createSpyObj('LaunchDarklyService', ['getFlag']);
        latestPexipFlagSubject = new Subject<boolean>();
        latestPexipFlagSubject.next(true);
        launchDarklyService.getFlag
            .withArgs(FEATURE_FLAGS.pexipV36, jasmine.any(Boolean))
            .and.returnValue(latestPexipFlagSubject.asObservable());

        renderer.createElement.and.returnValue(document.createElement('script'));
        rendererFactory.createRenderer.and.returnValue(renderer);
        TestBed.configureTestingModule({
            providers: [
                SupplierClientService,
                { provide: RendererFactory2, useValue: rendererFactory },
                { provide: LaunchDarklyService, useValue: launchDarklyService }
            ]
        });
        service = TestBed.inject(SupplierClientService);
        renderer.createElement.calls.reset();
        renderer.appendChild.calls.reset();
        renderer.removeChild.calls.reset();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should load the vodafone client', () => {
        service.loadSupplierScript(Supplier.Vodafone);
        expect(renderer.createElement).toHaveBeenCalledWith('script');
        expect(renderer.appendChild).toHaveBeenCalledWith(document.body, jasmine.any(HTMLScriptElement));
        expect((renderer.appendChild as jasmine.Spy).calls.mostRecent().args[1].src).toContain('scripts/vodafone/pexrtc.js');
    });

    it('should load the vodafoneV36 client', fakeAsync(() => {
        latestPexipFlagSubject.next(true);
        flush();
        service.loadSupplierScript(Supplier.Vodafone);
        expect(renderer.createElement).toHaveBeenCalledWith('script');
        expect(renderer.appendChild).toHaveBeenCalledWith(document.body, jasmine.any(HTMLScriptElement));
        expect((renderer.appendChild as jasmine.Spy).calls.mostRecent().args[1].src).toContain('scripts/vodafoneV36/pexrtc.js');
    }));

    it('should throw an error if an invalid supplier is passed', () => {
        expect(() => service.loadSupplierScript('InvalidSupplier' as unknown as Supplier)).toThrowError('Invalid supplier');
    });

    it('should not load the script if it already exists', () => {
        const existingScript = document.createElement('script');
        existingScript.src = 'scripts/vodafone/pexrtc.js';

        spyOn(document, 'querySelector').and.returnValue(existingScript);
        spyOn(document, 'querySelectorAll').and.returnValue([existingScript] as unknown as NodeListOf<HTMLScriptElement>);

        service.loadSupplierScript(Supplier.Vodafone);

        expect(renderer.createElement).not.toHaveBeenCalled();
        expect(renderer.appendChild).not.toHaveBeenCalled();
    });

    it('should replace existing scripts for different suppliers', () => {
        const existingScript = document.createElement('script');
        existingScript.src = 'scripts/different-supplier/pexrtc.js';

        spyOn(document, 'querySelector').and.callFake((selector: string) => {
            if (selector === `script[src="${existingScript.src}"]`) {
                return existingScript;
            }
            return null;
        });
        spyOn(document, 'querySelectorAll').and.returnValue([existingScript] as unknown as NodeListOf<HTMLScriptElement>);

        service.loadSupplierScript(Supplier.Vodafone);

        expect(renderer.removeChild).toHaveBeenCalledWith(document.body, existingScript);
        expect(renderer.appendChild).toHaveBeenCalledWith(document.body, jasmine.any(HTMLScriptElement));
        expect((renderer.appendChild as jasmine.Spy).calls.mostRecent().args[1].src).toContain('scripts/vodafone/pexrtc.js');
    });
});
