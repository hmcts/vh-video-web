import { Injectable, } from '@angular/core';
import 'webrtc-adapter';
import { UserMediaDevice } from '../on-the-day/models/user-media-device';

@Injectable({
    providedIn: 'root',
})
export class UserMediaService {

    readonly permissionConstraints = {
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

    readonly camOnlyConstraints = {
        audio: false,
        video: true
    };

    _navigator = <any>navigator;

    private stream: MediaStream;
    private inputStream: MediaStream;

    devices: UserMediaDevice[];

    private preferredCamera: UserMediaDevice;
    private preferredMicrophone: UserMediaDevice;

    constructor() {
        this.preferredCamera = null;
        this.preferredMicrophone = null;
        this._navigator.getUserMedia = (this._navigator.getUserMedia || this._navigator.webkitGetUserMedia
            || this._navigator.mozGetUserMedia || this._navigator.msGetUserMedia);
    }

    async requestAccess(): Promise<boolean> {
        try {
            await this.getStream();
            return true;
        } catch (exception) {
            console.error(`could not get cam and mic access because ${exception}`);
            return false;
        }
    }

    private async getStream(): Promise<MediaStream> {
        if (this.stream) {
            this.stopStream();
        }

        this.stream = await this._navigator.mediaDevices.getUserMedia(this.permissionConstraints);
        return this.stream;
    }

    async getPreferredMicStream(): Promise<MediaStream> {
        if (this.preferredMicrophone) {
            console.log(`using preferred mic ${this.preferredMicrophone.label}`);
            console.log(this.preferredMicrophone.deviceId);
            const stream = await this._navigator.mediaDevices.getUserMedia(
                { audio: { deviceId: { exact: this.preferredMicrophone.deviceId } } }
            );
            return stream;
        } else {
            console.log(`using default mic`);
            return this.getMicStream();
        }
    }

    async getPreferredCameraStream(): Promise<MediaStream> {
        if (this.preferredCamera) {
            console.log(`using preferred cam ${this.preferredCamera.label}`);
            console.log(this.preferredCamera.deviceId);

            const stream = await this._navigator.mediaDevices.getUserMedia(
                { video: { deviceId: { exact: this.preferredCamera.deviceId } } }
            );
            return stream;
        } else {
            console.log(`using default cam`);
            return this.getCameraStream();
        }
    }

    private async getCameraStream(): Promise<MediaStream> {
        return await this._navigator.mediaDevices.getUserMedia(this.camOnlyConstraints);
    }

    private async getMicStream(): Promise<MediaStream> {
        return await this._navigator.mediaDevices.getUserMedia(this.micOnlyConstraints);
    }

    async updateAvailableDevicesList(): Promise<UserMediaDevice[]> {
        if (!this._navigator.mediaDevices || !this._navigator.mediaDevices.enumerateDevices) {
            console.log('enumerateDevices() not supported.');
            return [];
        }

        const updatedDevices: MediaDeviceInfo[] = await this._navigator.mediaDevices.enumerateDevices();
        this.devices = Array.from(updatedDevices, device =>
            new UserMediaDevice(device.label, device.deviceId, device.kind, device.groupId)
        );
        return this.devices;
    }

    async getListOfVideoDevices(): Promise<UserMediaDevice[]> {
        await this.updateAvailableDevicesList();
        return this.devices.filter(x => x.kind === 'videoinput');
    }

    async getListOfMicrophoneDevices(): Promise<UserMediaDevice[]> {
        this.updateAvailableDevicesList();
        return this.devices.filter(x => x.kind === 'audioinput');
    }

    async hasMultipleDevices(): Promise<boolean> {
        const camDevices = await this.getListOfVideoDevices();
        const micDevices = await this.getListOfMicrophoneDevices();

        return micDevices.length > 1 || camDevices.length > 1;
    }

    getPreferredCamera() {
        return this.preferredCamera;
    }

    getPreferredMicrophone() {
        return this.preferredMicrophone;
    }

    updatePreferredCamera(camera: UserMediaDevice) {
        this.preferredCamera = camera;
    }

    updatePreferredMicrophone(microphone: UserMediaDevice) {
        this.preferredMicrophone = microphone;
    }

    stopStream() {
        this.stopAStream(this.stream);
    }

    stopInputStream() {
        this.stopAStream(this.inputStream);
    }

    stopAStream(stream: MediaStream) {
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
