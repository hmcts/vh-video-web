import { Renderer2, RendererFactory2 } from '@angular/core';
import { fakeAsync, flush } from '@angular/core/testing';
import { DeviceDetectorService } from 'ngx-device-detector';
import { Logger } from './logging/logger-base';
import { UnloadDetectorService } from './unload-detector.service';

class Renderer2Mock {
    beforeUnloadCallback: (event: any) => boolean | void;
    visibiltyChangeCallback: (event: any) => boolean | void;
    pageHideCallback: (event: any) => boolean | void;

    listen(target: 'window' | 'document' | 'body' | any, eventName: string, callback: (event: any) => boolean | void) {
        if (target === 'window' && eventName === 'beforeunload') {
            this.beforeUnloadCallback = callback;
        } else if (target === 'document' && eventName === 'visibilitychange') {
            this.visibiltyChangeCallback = callback;
        } else if (target === 'window' && eventName === 'pagehide') {
            this.pageHideCallback = callback;
        }
    }
}

describe('UnloadDetectorService', () => {
    let service: UnloadDetectorService;
    let deviceDetectorServiceSpy: jasmine.SpyObj<DeviceDetectorService>;
    let renderer2FactorySpy: jasmine.SpyObj<RendererFactory2>;
    let renderer2Mock: Renderer2Mock;
    let loggerSpy: jasmine.SpyObj<Logger>;

    beforeEach(() => {
        deviceDetectorServiceSpy = jasmine.createSpyObj<DeviceDetectorService>('DeviceDetectorService', ['isDesktop']);
        renderer2FactorySpy = jasmine.createSpyObj<RendererFactory2>('RendererFactory2', ['createRenderer']);
        loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['info']);

        renderer2Mock = new Renderer2Mock();
        spyOn(renderer2Mock, 'listen').and.callThrough();

        renderer2FactorySpy.createRenderer.withArgs(null, null).and.returnValue((renderer2Mock as unknown) as Renderer2);
    });

    describe('when on desktop', () => {
        beforeEach(() => {
            deviceDetectorServiceSpy.isDesktop.and.returnValue(true);
            service = new UnloadDetectorService(deviceDetectorServiceSpy, renderer2FactorySpy, loggerSpy);
        });

        it('should create', () => {
            expect(service).toBeTruthy();
        });

        it('should listen to the before unload event', () => {
            expect(renderer2Mock.listen).toHaveBeenCalledOnceWith('window', 'beforeunload', jasmine.anything());
        });

        it('should emit the shouldUnload event when the before unload callback is recieved', fakeAsync(() => {
            // Arrange
            let wasCalled = false;
            service.shouldUnload.subscribe(() => (wasCalled = true));

            // Act
            renderer2Mock.beforeUnloadCallback(undefined);
            flush();

            // Assert
            expect(wasCalled).toBeTrue();
        }));
    });

    describe('when NOT on desktop', () => {
        beforeEach(() => {
            deviceDetectorServiceSpy.isDesktop.and.returnValue(false);
            service = new UnloadDetectorService(deviceDetectorServiceSpy, renderer2FactorySpy, loggerSpy);
        });

        it('should create', () => {
            expect(service).toBeTruthy();
        });

        it('should listen to the visibility change event and pagehide event', () => {
            expect(renderer2Mock.listen).toHaveBeenCalledTimes(2);
            expect(renderer2Mock.listen).toHaveBeenCalledWith('document', 'visibilitychange', jasmine.anything());
            expect(renderer2Mock.listen).toHaveBeenCalledWith('window', 'pagehide', jasmine.anything());
        });

        it('should emit the shouldUnload event when the visibilitychange event is recieved with the isHidden as true', fakeAsync(() => {
            // Arrange
            let wasCalled = false;
            service.shouldUnload.subscribe(() => (wasCalled = true));

            spyOnProperty(document, 'hidden', 'get').and.returnValue(true);

            // Act
            renderer2Mock.visibiltyChangeCallback(undefined);
            flush();

            // Assert
            expect(wasCalled).toBeTrue();
        }));

        it('should emit the shouldUnload event when the pageHide event is recieved', fakeAsync(() => {
            // Arrange
            let wasCalled = false;
            service.shouldUnload.subscribe(() => (wasCalled = true));

            // Act
            renderer2Mock.pageHideCallback(undefined);
            flush();

            // Assert
            expect(wasCalled).toBeTrue();
        }));

        it('should NOT emit the shouldUnload event when the visibilitychange event is recieved with the isHidden as false', fakeAsync(() => {
            // Arrange
            let wasCalled = false;
            service.shouldUnload.subscribe(() => (wasCalled = true));

            spyOnProperty(document, 'hidden', 'get').and.returnValue(false);

            // Act
            renderer2Mock.visibiltyChangeCallback(undefined);
            flush();

            // Assert
            expect(wasCalled).toBeFalse();
        }));

        it('should NOT emit the shouldReload event when the visibilitychange event is recieved with the isHidden as true', fakeAsync(() => {
            // Arrange
            let wasCalled = false;
            service.shouldReload.subscribe(() => (wasCalled = true));

            spyOnProperty(document, 'hidden', 'get').and.returnValue(true);

            // Act
            renderer2Mock.visibiltyChangeCallback(undefined);
            flush();

            // Assert
            expect(wasCalled).toBeFalse();
        }));

        it('should NOT emit the shouldReload event when the visibilitychange event is recieved with the isHidden as false AND unload has NOT been emitted', fakeAsync(() => {
            // Arrange
            let wasCalled = false;
            service.shouldReload.subscribe(() => (wasCalled = true));

            spyOnProperty(document, 'hidden', 'get').and.returnValue(false);

            // Act
            renderer2Mock.visibiltyChangeCallback(undefined);
            flush();

            // Assert
            expect(wasCalled).toBeFalse();
        }));

        it('should emit the shouldReload event when the visibilitychange event is recieved with the isHidden as false AND unload has been emitted', fakeAsync(() => {
            // Arrange
            let wasShouldReloadCalled = false;
            service.shouldReload.subscribe(() => (wasShouldReloadCalled = true));

            // First value for the page been hidden (switch tab/press home button) second value for the page becoming visible
            spyOnProperty(document, 'hidden', 'get').and.returnValues(true, false);

            // Simulate the events from the user switching tabs/pressing the home button
            renderer2Mock.visibiltyChangeCallback(undefined);
            flush();

            // Act
            renderer2Mock.visibiltyChangeCallback(undefined);
            flush();

            // Assert
            expect(wasShouldReloadCalled).toBeTrue();
        }));
    });
});
