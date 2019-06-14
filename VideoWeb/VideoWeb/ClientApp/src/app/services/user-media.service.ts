import { Injectable, } from '@angular/core';
import 'webrtc-adapter';

const browser = <any>navigator;
browser.mediaDevices.getUserMedia = (browser.mediaDevices.getUserMedia ||
    browser.webkitGetUserMedia ||
    browser.mozGetUserMedia ||
    browser.msGetUserMedia);

@Injectable({
    providedIn: 'root',
})
export class UserMediaService {

    readonly constraints = {
        audio: true,
        video: true
    };

    readonly micOnlyConstraints = {
        audio: {
            mandatory: {
                echoCancellation: false, // disabling audio processing
                googAutoGainControl: true,
                googNoiseSuppression: true,
                googHighpassFilter: true,
                googTypingNoiseDetection: true
            },
            optional: []
        },
        video: false
    };

    private stream: MediaStream;
    private inputStream: MediaStream;

    devices: MediaDeviceInfo[];

    async requestAccess(): Promise<boolean> {
        try {
            await this.getStream();
            return true;
        } catch (exception) {
            console.error(`could not get cam and mic access because ${exception}`);
            return false;
        }
    }

    async getStream(): Promise<MediaStream> {
        console.log('requesting camera and mic access');
        if (this.stream) {
            console.log('closing existing video and mic stream');
            this.stopStream();
        }

        this.stream = await browser.mediaDevices.getUserMedia(this.constraints);
        return this.stream;
    }

    async getMicStream(): Promise<MediaStream> {
        console.log('getting mic input stream');
        if (this.inputStream) {
            console.log('closing existing mic stream');
            this.stopStream();
        }

        this.stream = await browser.mediaDevices.getUserMedia(this.micOnlyConstraints);
        return this.stream;
    }

    async getListOfVideoDevices(): Promise<MediaDeviceInfo[]> {
        if (!browser.mediaDevices || !browser.mediaDevices.enumerateDevices) {
            console.log('enumerateDevices() not supported.');
            return [];
        }
        this.devices = await browser.mediaDevices.enumerateDevices();
        return this.devices.filter(x => x.kind === 'videoinput');
    }

    async getListOfMicrophoneDevices(): Promise<MediaDeviceInfo[]> {
        if (!browser.mediaDevices || !browser.mediaDevices.enumerateDevices) {
            console.log('enumerateDevices() not supported.');
            return [];
        }
        this.devices = await browser.mediaDevices.enumerateDevices();
        return this.devices.filter(x => x.kind === 'audioinput');
    }

    stopStream() {
        console.log('closing camera and mic stream');
        this.stopAStream(this.stream);
    }

    stopInputStream() {
        console.log('closing mic stream');
        this.stopAStream(this.inputStream);
    }

    private stopAStream(stream: MediaStream) {
        if (!stream) {
            return;
        }

        stream.getAudioTracks().forEach((track) => {
            track.stop();
        });
        stream.getVideoTracks().forEach((track) => {
            track.stop();
        });
    }
}