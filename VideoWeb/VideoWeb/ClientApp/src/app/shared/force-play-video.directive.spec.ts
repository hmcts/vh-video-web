import { ElementRef, Renderer2, RendererFactory2 } from '@angular/core';
import { Logger } from '../services/logging/logger-base';
import { ForcePlayVideoDirective } from './force-play-video.directive';
import { getSpiedPropertyGetter, getSpiedPropertySetter } from './jasmine-helpers/property-helpers';
import { fakeAsync, tick } from '@angular/core/testing';

describe('ForcePlayVideoDirective', () => {
    let elementRefSpy: jasmine.SpyObj<ElementRef>;
    let nativeElementSpy: jasmine.SpyObj<HTMLVideoElement>;
    let renderer2FactorySpy: jasmine.SpyObj<RendererFactory2>;
    let renderer2Spy: jasmine.SpyObj<Renderer2>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    let directive: ForcePlayVideoDirective;

    let onCanPlayCallback: (event: any) => void = null;
    let onPlayingCallback: (event: any) => void = null;
    let onPauseCallback: (event: any) => void = null;
    let onErrorCallback: (event: any) => void = null;

    beforeEach(() => {
        elementRefSpy = jasmine.createSpyObj<ElementRef>([], ['nativeElement']);
        nativeElementSpy = jasmine.createSpyObj<HTMLVideoElement>(['play', 'pause'], ['oncanplay', 'onerror', 'onplaying', 'onpause']);
        nativeElementSpy.play.and.callFake(() => Promise.resolve());
        getSpiedPropertyGetter(elementRefSpy, 'nativeElement').and.returnValue(nativeElementSpy);
        getSpiedPropertySetter(nativeElementSpy, 'oncanplay').and.callFake((callback: (event: any) => void) => {
            onCanPlayCallback = callback;
        });

        getSpiedPropertySetter(nativeElementSpy, 'onplaying').and.callFake((callback: (event: any) => void) => {
            onPlayingCallback = callback;
        });

        getSpiedPropertySetter(nativeElementSpy, 'onpause').and.callFake((callback: (event: any) => void) => {
            onPauseCallback = callback;
        });

        getSpiedPropertySetter(nativeElementSpy, 'onerror').and.callFake((callback: (event: any) => void) => {
            onErrorCallback = callback;
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

    describe('when video playback fails', () => {
        it('should log a warning and set isPlaying to false', () => {
            // Arrange
            directive.ngOnInit();
            directive['isPlaying'] = true;
            const error = 'something went wrong';
            // Act
            onErrorCallback(error);

            // Assert
            expect(loggerSpy.warn).toHaveBeenCalledTimes(1);
            expect(loggerSpy.warn).toHaveBeenCalledWith('[ForcePlayVideoDirective] - - videoElement.onError - event triggered', error);
            expect(directive['isPlaying']).toBeFalse();
        });
    });

    describe('when video playback pauses', () => {
        it('should set isPlaying to false', () => {
            // Arrange
            directive.ngOnInit();
            directive['isPlaying'] = true;
            // Act
            onPauseCallback(null);

            // Assert
            expect(loggerSpy.debug).toHaveBeenCalledWith('[ForcePlayVideoDirective] - - videoElement.onpause - event triggered');
            expect(directive['isPlaying']).toBeFalse();
        });
    });

    describe('when video onPlaying', () => {
        it('should set isPlaying to true', () => {
            // Arrange
            directive.ngOnInit();
            directive['isPlaying'] = false;
            // Act
            onPlayingCallback(null);

            // Assert
            expect(loggerSpy.debug).toHaveBeenCalledWith('[ForcePlayVideoDirective] - - videoElement.onplaying - event triggered');
            expect(directive['isPlaying']).toBeTrue();
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

        it('should not try to play if already playing', () => {
            // Arrange
            directive.ngOnInit();
            directive['isPlaying'] = true;

            // Act
            onCanPlayCallback(null);

            // Assert
            expect(nativeElementSpy.play).not.toHaveBeenCalled();
        });

        it('should capture error when play fails', fakeAsync(() => {
            // Arrange
            directive.ngOnInit();

            nativeElementSpy.play.and.callFake(() => Promise.reject('test error'));

            // Act
            onCanPlayCallback(null);
            tick();

            // Assert
            expect(nativeElementSpy.play).toHaveBeenCalledTimes(1);
            expect(loggerSpy.error).toHaveBeenCalledTimes(1);
            expect(loggerSpy.error).toHaveBeenCalledWith('[ForcePlayVideoDirective] - - error playing video.', jasmine.anything());
        }));

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

        it('should not play the video if already playing', () => {
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
            directive['isPlaying'] = true;

            // Act
            mouseDownCallback(null);

            // Assert
            expect(nativeElementSpy.play).not.toHaveBeenCalled();
            expect(unsubscribedFromMouseDown).toBeTrue();
            expect(unsubscribedFromTouchStart).toBeTrue();
        });

        it('should capture error when play fails', fakeAsync(() => {
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
            nativeElementSpy.play.and.callFake(() => Promise.reject('test error'));

            // Act
            mouseDownCallback(null);
            tick();

            // Assert
            expect(nativeElementSpy.play).toHaveBeenCalledTimes(1);
            expect(loggerSpy.error).toHaveBeenCalledTimes(1);
            expect(loggerSpy.error).toHaveBeenCalledWith('[ForcePlayVideoDirective] - - error playing video.', jasmine.anything());
        }));
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
            directive['isPlaying'] = true;

            // Act
            directive.ngOnDestroy();

            // Assert
            expect(unsubscribedFromMouseDown).toBeTrue();
            expect(unsubscribedFromTouchStart).toBeTrue();
            expect(nativeElementSpy.pause).toHaveBeenCalledTimes(1);
        });

        it('should not attempt to pause when video is not playing', () => {
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
            directive['isPlaying'] = false;

            // Act
            directive.ngOnDestroy();

            // Assert
            expect(unsubscribedFromMouseDown).toBeTrue();
            expect(unsubscribedFromTouchStart).toBeTrue();
            expect(nativeElementSpy.pause).toHaveBeenCalledTimes(0);
        });
    });
});
