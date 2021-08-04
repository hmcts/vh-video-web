import { Injectable } from '@angular/core';

import { Results, SelfieSegmentation } from '@mediapipe/selfie_segmentation';
import { Camera } from '@mediapipe/camera_utils';
import { BackgroundEffect } from './models/background-effect';

@Injectable({
    providedIn: 'root'
})
export class VirtualBackgroundService {
    videoElement: HTMLVideoElement;
    canvasElement: HTMLCanvasElement;

    canvasCtx: CanvasRenderingContext2D;

    selfieSegmentation: SelfieSegmentation;
    activeEffect: BackgroundEffect;

    /**
     *
     */
    constructor() {
        this.activeEffect = BackgroundEffect.blur;
    }
    initElementsAndCtx() {
        this.videoElement = document.createElement('video');
        this.canvasElement = document.createElement('canvas');

        this.canvasCtx = this.canvasElement.getContext('2d');
    }

    startImageSegmentation(originalStream: MediaStream): MediaStream {
        if (!this.videoElement || !this.canvasElement || !this.canvasCtx) {
            throw new Error(`Background Service context not initialised`);
        }
        this.selfieSegmentation = new SelfieSegmentation({
            locateFile: file => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1622680987/${file}`;
            }
        });
        this.selfieSegmentation.setOptions({
            modelSelection: 1,
            selfieMode: true
        });

        this.selfieSegmentation.onResults(results => this.onSelfieSegmentationResults(results));

        const camera = new Camera(this.videoElement, {
            onFrame: async () => {
                await this.selfieSegmentation.send({ image: this.videoElement });
            },
            width: 720,
            height: 1280
        });

        camera.start();
        const stream = this.canvasElement.captureStream();
        originalStream.getAudioTracks().forEach(track => {
            stream.addTrack(track);
        });
        return stream;
    }

    onSelfieSegmentationResults(results: Results): void {
        // Draw the overlays.
        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

        this.canvasCtx.drawImage(results.segmentationMask, 0, 0, this.canvasElement.width, this.canvasElement.height);

        // Only overwrite existing pixels.
        this.canvasCtx.globalCompositeOperation = 'source-in';

        this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);

        // Only overwrite missing pixels.
        this.canvasCtx.globalCompositeOperation = 'destination-atop';
        this.applyEffect(results);
        this.canvasCtx.restore();
    }

    applyEffect(results: Results) {
        switch (this.activeEffect) {
            case BackgroundEffect.architecture:
                this.applyVirtualBackgroundEffect(results);
                break;
            default:
                this.applyBlurEffect(results);
                break;
        }
    }

    applyBlurEffect(results: Results) {
        this.canvasCtx.filter = 'blur(10px)';
        this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
    }

    applyVirtualBackgroundEffect(results: Results) {
        const imageName = this.activeEffect.toString().toLowerCase();
        // With Background image
        const imageObject = new Image();
        imageObject.src = `/assets/images/${imageName}.jpg`;
        this.canvasCtx.imageSmoothingEnabled = true;
        this.canvasCtx.drawImage(imageObject, 0, 0, this.canvasElement.width, this.canvasElement.height);
    }
}
