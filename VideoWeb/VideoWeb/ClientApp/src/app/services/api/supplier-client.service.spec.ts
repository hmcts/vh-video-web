import { TestBed } from '@angular/core/testing';
import { SupplierClientService } from './supplier-client.service';
import { RendererFactory2 } from '@angular/core';

describe('SupplierClientService', () => {
    let service: SupplierClientService;
    const renderer = jasmine.createSpyObj('Renderer2', ['createElement', 'appendChild']);
    const rendererFactory = jasmine.createSpyObj('RendererFactory2', ['createRenderer']);

    beforeEach(() => {
        renderer.createElement.and.returnValue(document.createElement('script'));
        rendererFactory.createRenderer.and.returnValue(renderer);
        TestBed.configureTestingModule({
            providers: [
                SupplierClientService,  { provide: RendererFactory2, useValue: rendererFactory }
            ]
        });
        service = TestBed.inject(SupplierClientService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should load the vodafone client', () => {
        service.loadSupplierScript('vodafone');
        expect(renderer.createElement).toHaveBeenCalledWith('script');
        expect(renderer.appendChild).toHaveBeenCalledWith(document.body, jasmine.any(HTMLScriptElement));
        expect((renderer.appendChild as jasmine.Spy).calls.mostRecent().args[1].src).toContain('scripts/vodafone/pexrtc.js');
    });

    it('should load the kinly client script', async () => {
        service.loadSupplierScript('kinly');
        expect(renderer.createElement).toHaveBeenCalledWith('script');
        expect(renderer.appendChild).toHaveBeenCalledWith(document.body, jasmine.any(HTMLScriptElement));
        expect((renderer.appendChild as jasmine.Spy).calls.mostRecent().args[1].src).toContain('scripts/kinly/pexrtc.js');
    });

    it('should throw an error if an invalid supplier is passed', () => {
        expect(() => service.loadSupplierScript('invalid')).toThrowError('Invalid supplier');
    });
});
