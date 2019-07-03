import { Injectable, } from '@angular/core';
import 'webrtc-adapter';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { SessionStorage } from './session-storage';
import { Logger } from './logging/logger-base';

@Injectable({
    providedIn: 'root',
})
export class UserMediaService {

    _navigator = <any>navigator;

    private readonly preferredCamCache: SessionStorage<UserMediaDevice>;
    private readonly preferredMicCache: SessionStorage<UserMediaDevice>;
    private PREFERRED_CAMERA_KEY = 'vh.preferred.camera';
    private PREFERRED_MICROPHONE_KEY = 'vh.preferred.microphone';

    constructor(private logger: Logger) {
        this.preferredCamCache = new SessionStorage(this.PREFERRED_CAMERA_KEY);
        this.preferredMicCache = new SessionStorage(this.PREFERRED_MICROPHONE_KEY);

        this._navigator.getUserMedia = (this._navigator.getUserMedia || this._navigator.webkitGetUserMedia
            || this._navigator.mozGetUserMedia || this._navigator.msGetUserMedia);
    }

    async getListOfVideoDevices(): Promise<UserMediaDevice[]> {
        const devices = await this.getAvailableDevicesList();
        return devices.filter(x => x.kind === 'videoinput');
    }

    async getListOfMicrophoneDevices(): Promise<UserMediaDevice[]> {
        const devices = await this.getAvailableDevicesList();
        return devices.filter(x => x.kind === 'audioinput');
    }

    private async getAvailableDevicesList(): Promise<UserMediaDevice[]> {
        if (!this._navigator.mediaDevices || !this._navigator.mediaDevices.enumerateDevices) {
            this.logger.error('enumerateDevices() not supported.', new Error('enumerateDevices() not supported.'));
            return [];
        }

        const updatedDevices: MediaDeviceInfo[] = await this._navigator.mediaDevices.enumerateDevices();
        return Array.from(updatedDevices, device =>
            new UserMediaDevice(device.label, device.deviceId, device.kind, device.groupId)
        );
    }

    async hasMultipleDevices(): Promise<boolean> {
        const camDevices = await this.getListOfVideoDevices();
        const micDevices = await this.getListOfMicrophoneDevices();

        return micDevices.length > 1 || camDevices.length > 1;
    }

    getPreferredCamera() {
        return this.preferredCamCache.get();
    }

    getPreferredMicrophone() {
        return this.preferredMicCache.get();
    }

    updatePreferredCamera(camera: UserMediaDevice) {
        this.preferredCamCache.set(camera);
    }

    updatePreferredMicrophone(microphone: UserMediaDevice) {
        this.preferredMicCache.set(microphone);
    }
}
