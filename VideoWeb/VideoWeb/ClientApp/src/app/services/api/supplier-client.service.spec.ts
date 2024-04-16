import { TestBed } from '@angular/core/testing';
import { SupplierClientService } from './supplier-client.service';
import { RendererFactory2 } from '@angular/core';
import { FEATURE_FLAGS, LaunchDarklyService } from '../launch-darkly.service';
import { of } from 'rxjs';

describe('SupplierClientService', () => {
    let service: SupplierClientService;
    const launchDarklyService = jasmine.createSpyObj('LaunchDarklyService', ['getFlag']);
    const renderer = jasmine.createSpyObj('Renderer2', ['createElement', 'appendChild']);
    const rendererFactory = jasmine.createSpyObj('RendererFactory2', ['createRenderer']);

    beforeEach(() => {
        renderer.createElement.and.returnValue(document.createElement('script'));
        rendererFactory.createRenderer.and.returnValue(renderer);
        TestBed.configureTestingModule({
            providers: [
                SupplierClientService,
                { provide: LaunchDarklyService, useValue: launchDarklyService },
                { provide: RendererFactory2, useValue: rendererFactory }
            ]
        });
    });

    describe('Vodafone toggle on', () => {
        beforeEach(() => {
            launchDarklyService.getFlag.withArgs(FEATURE_FLAGS.vodafone).and.returnValue(of(true));
            service = TestBed.inject(SupplierClientService);
        });

        it('should be created', () => {
            expect(service).toBeTruthy();
        });

        it('should load the vodafone client script when vodafone toggle on', async () => {
            await service.loadSupplierScript();
            expect(renderer.createElement).toHaveBeenCalledWith('script');
            expect(renderer.appendChild).toHaveBeenCalledWith(document.body, jasmine.any(HTMLScriptElement));
            expect((renderer.appendChild as jasmine.Spy).calls.mostRecent().args[1].src).toContain('scripts/vodafone/pexrtc.js');
        });
    });

    describe('Vodafone toggle off', () => {
        beforeEach(() => {
            launchDarklyService.getFlag.withArgs(FEATURE_FLAGS.vodafone).and.returnValue(of(false));
            service = TestBed.inject(SupplierClientService);

        });

        it('should be created', () => {
            expect(service).toBeTruthy();
        });

        it('should load the kinly client script when vodafone toggle off', async () => {
            await service.loadSupplierScript();
            expect(renderer.createElement).toHaveBeenCalledWith('script');
            expect(renderer.appendChild).toHaveBeenCalledWith(document.body, jasmine.any(HTMLScriptElement));
            expect((renderer.appendChild as jasmine.Spy).calls.mostRecent().args[1].src).toContain('scripts/kinly/pexrtc.js');
        });
    })
});
