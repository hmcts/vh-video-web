import { Renderer2, RendererFactory2 } from '@angular/core';
import { fakeAsync, flush } from '@angular/core/testing';
import { DeviceDetectorService } from 'ngx-device-detector';
import { Subject } from 'rxjs';
import { getSpiedPropertyGetter } from '../shared/jasmine-helpers/property-helpers';
import { Logger } from './logging/logger-base';
import { NoSleepService } from './no-sleep.service';
import { UserMediaStreamService } from './user-media-stream.service';

describe('NoSleepService', () => {
    let service: NoSleepService;

    let userMediaStreamServiceSpy: jasmine.SpyObj<UserMediaStreamService>;
    let renderer2FactorySpy: jasmine.SpyObj<RendererFactory2>;
    let renderer2Spy: jasmine.SpyObj<Renderer2>;
    let deviceServiceSpy: jasmine.SpyObj<DeviceDetectorService>;
    let documentSpy: jasmine.SpyObj<Document>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    let currentStreamSubject: Subject<MediaStream>;
    let videoElementSpy: jasmine.SpyObj<HTMLVideoElement>;
    let touchStartCallback: (e: any) => boolean | void = null;

    beforeEach(() => {
        currentStreamSubject = new Subject<MediaStream>();
        userMediaStreamServiceSpy = jasmine.createSpyObj<UserMediaStreamService>([], ['currentStream$']);
        getSpiedPropertyGetter(userMediaStreamServiceSpy, 'currentStream$').and.returnValue(currentStreamSubject.asObservable());

        videoElementSpy = jasmine.createSpyObj<HTMLVideoElement>(['play', 'setAttribute'], ['style', 'parentElement']);
        getSpiedPropertyGetter(videoElementSpy, 'style').and.returnValue({} as CSSStyleDeclaration);

        renderer2FactorySpy = jasmine.createSpyObj<RendererFactory2>(['createRenderer']);
        renderer2Spy = jasmine.createSpyObj<Renderer2>(['listen']);
        renderer2FactorySpy.createRenderer.withArgs(null, null).and.returnValue(renderer2Spy);

        renderer2Spy.listen.and.callFake((target: any, eventName: string, callback: (event: any) => boolean | void) => {
            touchStartCallback = callback;
            return () => {};
        });

        deviceServiceSpy = jasmine.createSpyObj<DeviceDetectorService>(['isDesktop']);

        documentSpy = jasmine.createSpyObj<Document>(['createElement', 'getElementsByTagName']);
        documentSpy.createElement.withArgs('video').and.returnValue(videoElementSpy);

        loggerSpy = jasmine.createSpyObj<Logger>(['info', 'debug', 'warn', 'error']);

        service = new NoSleepService(userMediaStreamServiceSpy, renderer2FactorySpy, deviceServiceSpy, documentSpy, loggerSpy);
    });

    describe('enable', () => {
        it('should return of there is already a video element', () => {
            // Arrange
            service['videoElement'] = {} as HTMLVideoElement;

            // Act
            service.enable();

            // Assert
            expect(documentSpy.createElement).not.toHaveBeenCalled();
            expect(documentSpy.getElementsByTagName).not.toHaveBeenCalled();
        });

        it('should create a video element and add it to the first div in the page', () => {
            // Arrange
            const firstDivSpy = jasmine.createSpyObj<HTMLDivElement>(['appendChild']);
            const secondDivSpy = jasmine.createSpyObj<HTMLDivElement>(['appendChild']);

            documentSpy.getElementsByTagName.withArgs('div').and.returnValue(({
                0: firstDivSpy,
                1: secondDivSpy
            } as unknown) as HTMLCollectionOf<Element>);

            service['videoElement'] = null;

            // Act
            service.enable();

            // Assert
            expect(service['videoElement']).toBe(videoElementSpy);
            expect(documentSpy.createElement).toHaveBeenCalledOnceWith('video');
            expect(documentSpy.getElementsByTagName).toHaveBeenCalledWith('div');
            expect(firstDivSpy.appendChild).toHaveBeenCalledWith(videoElementSpy);
            expect(secondDivSpy.appendChild).not.toHaveBeenCalled();
        });

        it('should play the video immediately when the device is a desktop', () => {
            // Arrange
            const firstDivSpy = jasmine.createSpyObj<HTMLDivElement>(['appendChild']);
            const secondDivSpy = jasmine.createSpyObj<HTMLDivElement>(['appendChild']);
            documentSpy.getElementsByTagName.withArgs('div').and.returnValue(({
                0: firstDivSpy,
                1: secondDivSpy
            } as unknown) as HTMLCollectionOf<Element>);

            deviceServiceSpy.isDesktop.and.returnValue(true);

            service['videoElement'] = null;

            // Act
            service.enable();

            // Assert
            expect(videoElementSpy.play).toHaveBeenCalledTimes(1);
        });

        it('should play the video once the first touch has occured when the device is NOT a desktop', fakeAsync(() => {
            // Arrange
            const firstDivSpy = jasmine.createSpyObj<HTMLDivElement>(['appendChild']);
            const secondDivSpy = jasmine.createSpyObj<HTMLDivElement>(['appendChild']);
            documentSpy.getElementsByTagName.withArgs('div').and.returnValue(({
                0: firstDivSpy,
                1: secondDivSpy
            } as unknown) as HTMLCollectionOf<Element>);

            deviceServiceSpy.isDesktop.and.returnValue(false);

            service['videoElement'] = null;

            // Act & Assert
            service.enable();
            expect(videoElementSpy.play).not.toHaveBeenCalled();

            touchStartCallback(undefined);
            flush();
            expect(videoElementSpy.play).toHaveBeenCalledTimes(1);
        }));
    });

    describe('onCurrentStream change', () => {
        it('should update the current stream and video element source object if the video element exists', fakeAsync(() => {
            // Arrange
            service['videoElement'] = videoElementSpy;
            const newStream = new MediaStream();

            // Act
            service.onStreamChange(newStream);
            flush();

            // Assert
            expect(service['currentStream']).toBe(newStream);
            expect(videoElementSpy.srcObject).toBe(newStream);
        }));

        it('should only update the current stream video element DOES NOT exist', fakeAsync(() => {
            // Arrange
            const newStream = new MediaStream();
            service['videoElement'] = null;

            // Act
            service.onStreamChange(newStream);
            flush();

            // Assert
            expect(service['currentStream']).toBe(newStream);
            expect(service['videoElement']).toBeNull();
        }));
    });

    describe('disable', () => {
        it('should remove the video element from the div element', () => {
            // Arrange
            service['videoElement'] = videoElementSpy;
            const parentSpy = jasmine.createSpyObj<HTMLDivElement>(['removeChild']);
            getSpiedPropertyGetter(videoElementSpy, 'parentElement').and.returnValue(parentSpy);

            // Act
            service.disable();

            // Assert
            expect(parentSpy.removeChild).toHaveBeenCalledOnceWith(videoElementSpy);
            expect(service['videoElement']).toBeNull();
        });
    });
});
