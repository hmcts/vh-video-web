import { Renderer2, RendererFactory2 } from "@angular/core";
import { fakeAsync } from "@angular/core/testing";
import { DeviceDetectorService } from "ngx-device-detector";
import { UnloadDetectorService } from "./unload-detector.service";

class Renderer2Mock {
  beforeUnloadCallback: (event : any) => boolean | void;
  visibiltyChangeCallback: (event : any) => boolean | void;

  listen(target: 'window' | 'document' | 'body' | any, eventName: string, callback: (event: any) => boolean | void) {
    if (target === 'window' && eventName === 'beforeunload')
    {
      this.beforeUnloadCallback = callback;
    } else if (target === 'document' && eventName === 'visibilitychange') {
      this.visibiltyChangeCallback = callback;
    }
  }
}

describe('UnloadDetectorService', () => {
  let service: UnloadDetectorService;
  let deviceDetectorServiceSpy : jasmine.SpyObj<DeviceDetectorService>;
  let renderer2FactorySpy : jasmine.SpyObj<RendererFactory2>;
  let renderer2Mock : Renderer2Mock;

  beforeEach(() => {
    deviceDetectorServiceSpy = jasmine.createSpyObj<DeviceDetectorService>('DeviceDetectorService', ['isDesktop']);
    renderer2FactorySpy = jasmine.createSpyObj<RendererFactory2>('RendererFactory2', ['createRenderer']);

    renderer2Mock = new Renderer2Mock();
    spyOn(renderer2Mock, 'listen').and.callThrough();

    renderer2FactorySpy.createRenderer.withArgs(null, null).and.returnValue(renderer2Mock as unknown as Renderer2);
  });

  describe('when on desktop', () => {
    beforeEach(() => {
      deviceDetectorServiceSpy.isDesktop.and.returnValue(true);
      service = new UnloadDetectorService(deviceDetectorServiceSpy, renderer2FactorySpy);
    });

    it('should create', () => {
      expect(service).toBeTruthy();
    });

    it('should initialise the isDesktop value', () => {
      expect(service.isDesktop).toBeTrue();
    });

    it('should listen to the before unload event', () => {
      expect(renderer2Mock.listen).toHaveBeenCalledOnceWith('window', 'beforeunload', jasmine.anything());
    });

    it('should emit an event when the visibilitychange event is recieved with the isHidden as true', fakeAsync(() => {
      // Arrange
      let wasCalled = false;
      service.shouldUnload.subscribe(() => wasCalled = true);

      // Act
      renderer2Mock.beforeUnloadCallback(undefined);

      // Assert
      expect(wasCalled).toBeTrue();
    }));
  });

  describe('when NOT on desktop', () => {
    beforeEach(() => {
      deviceDetectorServiceSpy.isDesktop.and.returnValue(false);
      service = new UnloadDetectorService(deviceDetectorServiceSpy, renderer2FactorySpy);
    });

    it('should create', () => {
      expect(service).toBeTruthy();
    });

    it('should initialise the isDesktop value', () => {
      expect(service.isDesktop).toBeFalse();
    });

    it('should listen to the visibility change event', () => {
      expect(renderer2Mock.listen).toHaveBeenCalledOnceWith('document', 'visibilitychange', jasmine.anything());
    });

    it('should emit an event when the visibilitychange event is recieved with the isHidden as true', fakeAsync(() => {
      // Arrange
      let wasCalled = false;
      service.shouldUnload.subscribe(() => wasCalled = true);

      // Act
      renderer2Mock.visibiltyChangeCallback(undefined);

      // Assert
      expect(wasCalled).toBeTrue();
    }));
  });
});
