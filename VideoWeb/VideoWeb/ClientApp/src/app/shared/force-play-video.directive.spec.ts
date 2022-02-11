import { ElementRef, Renderer2, RendererFactory2, SimpleChange } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { Logger } from '../services/logging/logger-base';
import { ForcePlayVideoDirective } from './force-play-video.directive';
import { getSpiedPropertyGetter, getSpiedPropertySetter } from './jasmine-helpers/property-helpers';

describe('ForcePlayVideoDirective', () => {
    let elementRefSpy: jasmine.SpyObj<ElementRef>;
    let nativeElementSpy: jasmine.SpyObj<HTMLVideoElement>;
    let renderer2FactorySpy: jasmine.SpyObj<RendererFactory2>;
    let renderer2Spy: jasmine.SpyObj<Renderer2>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    let directive: ForcePlayVideoDirective;

    let onCanPlayCallback: (event: any) => void = null;

    beforeEach(() => {
        elementRefSpy = jasmine.createSpyObj<ElementRef>([], ['nativeElement']);
        nativeElementSpy = jasmine.createSpyObj<HTMLVideoElement>(['play', 'pause'], ['oncanplay']);

        getSpiedPropertyGetter(elementRefSpy, 'nativeElement').and.returnValue(nativeElementSpy);
        getSpiedPropertySetter(nativeElementSpy, 'oncanplay').and.callFake((callback: (event: any) => void) => {
            onCanPlayCallback = callback;
        });

        renderer2FactorySpy = jasmine.createSpyObj<RendererFactory2>(['createRenderer']);
        renderer2Spy = jasmine.createSpyObj<Renderer2>(['setAttribute', 'listen']);

        renderer2FactorySpy.createRenderer.withArgs(null, null).and.returnValue(renderer2Spy);

        loggerSpy = jasmine.createSpyObj<Logger>(['debug', 'info', 'warn', 'error']);

        directive = new ForcePlayVideoDirective(elementRefSpy, renderer2FactorySpy, loggerSpy);
    });

    it('should create an instance', () => {
        expect(directive).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should add the plays inline attribute and the auto play attribute', () => {
            // Act
            directive.ngOnInit();

            // Assert
            expect(renderer2Spy.setAttribute).toHaveBeenCalledTimes(2);
            expect(renderer2Spy.setAttribute).toHaveBeenCalledWith(nativeElementSpy, 'playsinline', 'true');
            expect(renderer2Spy.setAttribute).toHaveBeenCalledWith(nativeElementSpy, 'autoplay', 'true');
        });

        it('should subscribe to the on window click and on window touch events', () => {
            // Act
            directive.ngOnInit();

            // Assert
            expect(renderer2Spy.listen).toHaveBeenCalledTimes(2);
            expect(renderer2Spy.listen).toHaveBeenCalledWith('window', 'mousedown', jasmine.anything());
            expect(renderer2Spy.listen).toHaveBeenCalledWith('window', 'touchstart', jasmine.anything());
        });

        it('should subscribe to the on video ready to play event', () => {
            // Act
            directive.ngOnInit();

            // Assert
            expect(getSpiedPropertySetter(nativeElementSpy, 'oncanplay')).toHaveBeenCalledOnceWith(jasmine.anything());
            expect(onCanPlayCallback).toBeTruthy();
        });
    });

    describe('when can play', () => {
        it('should try to play immediately', () => {
            // Arrange
            directive.ngOnInit();

            // Act
            onCanPlayCallback(null);

            // Assert
            expect(nativeElementSpy.play).toHaveBeenCalledTimes(1);
        });

        it('should not try to play after destroyed', () => {
            // Arrange
            directive.ngOnInit();
            directive.ngOnDestroy();

            // Act
            onCanPlayCallback(null);

            // Assert
            expect(nativeElementSpy.play).not.toHaveBeenCalled();
        });
    });

    describe('when mouse down', () => {
        it('should play the video and unsubscribe from mousedown and touchstart', () => {
            // Arrange
            let mouseDownCallback: (event: any) => void;
            let unsubscribedFromMouseDown = false;

            const unsubscribeFromMouseDown = () => {
                unsubscribedFromMouseDown = true;
            };

            let unsubscribedFromTouchStart = false;
            const unsubscribeFromTouchStart = () => {
                unsubscribedFromTouchStart = true;
            };

            renderer2Spy.listen.and.callFake((target: any, eventName: string, callback: (event: any) => boolean | void) => {
                if (eventName === 'mousedown') {
                    mouseDownCallback = callback;
                    return unsubscribeFromMouseDown;
                } else if (eventName === 'touchstart') {
                    return unsubscribeFromTouchStart;
                }

                return () => {};
            });

            directive.ngOnInit();

            nativeElementSpy.play.calls.reset();

            // Act
            mouseDownCallback(null);

            // Assert
            expect(nativeElementSpy.play).toHaveBeenCalledTimes(1);
            expect(unsubscribedFromMouseDown).toBeTrue();
            expect(unsubscribedFromTouchStart).toBeTrue();
        });
    });

    describe('when touch start', () => {
        it('should play the video and unsubscribe from mousedown and touchstart', () => {
            // Arrange
            let touchStartCallback: (event: any) => void;
            let unsubscribedFromMouseDown = false;

            const unsubscribeFromMouseDown = () => {
                unsubscribedFromMouseDown = true;
            };

            let unsubscribedFromTouchStart = false;
            const unsubscribeFromTouchStart = () => {
                unsubscribedFromTouchStart = true;
            };

            renderer2Spy.listen.and.callFake((target: any, eventName: string, callback: (event: any) => boolean | void) => {
                if (eventName === 'mousedown') {
                    return unsubscribeFromMouseDown;
                } else if (eventName === 'touchstart') {
                    touchStartCallback = callback;
                    return unsubscribeFromTouchStart;
                }

                return () => {};
            });

            directive.ngOnInit();

            nativeElementSpy.play.calls.reset();

            // Act
            touchStartCallback(null);

            // Assert
            expect(nativeElementSpy.play).toHaveBeenCalledTimes(1);
            expect(unsubscribedFromMouseDown).toBeTrue();
            expect(unsubscribedFromTouchStart).toBeTrue();
        });
    });

    describe('ngOnDestroy', () => {
        it('should unsubscribe from the event listeners and pause video', () => {
            // Arrange
            let touchStartCallback: (event: any) => void;
            let unsubscribedFromMouseDown = false;

            const unsubscribeFromMouseDown = () => {
                unsubscribedFromMouseDown = true;
            };

            let unsubscribedFromTouchStart = false;
            const unsubscribeFromTouchStart = () => {
                unsubscribedFromTouchStart = true;
            };

            renderer2Spy.listen.and.callFake((target: any, eventName: string, callback: (event: any) => boolean | void) => {
                if (eventName === 'mousedown') {
                    return unsubscribeFromMouseDown;
                } else if (eventName === 'touchstart') {
                    touchStartCallback = callback;
                    return unsubscribeFromTouchStart;
                }

                return () => {};
            });

            directive.ngOnInit();

            nativeElementSpy.play.calls.reset();

            // Act
            directive.ngOnDestroy();

            // Assert
            expect(unsubscribedFromMouseDown).toBeTrue();
            expect(unsubscribedFromTouchStart).toBeTrue();
            expect(nativeElementSpy.pause).toHaveBeenCalledTimes(1);
        });
    });
});
