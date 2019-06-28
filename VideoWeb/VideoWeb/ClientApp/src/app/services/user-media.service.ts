import { Injectable, } from '@angular/core';
import 'webrtc-adapter';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { SessionStorage } from './session-storage';

@Injectable({
    providedIn: 'root',
})
export class UserMediaService {

    _navigator = <any>navigator;

    private readonly preferredCamCache: SessionStorage<UserMediaDevice>;
    private readonly preferredMicCache: SessionStorage<UserMediaDevice>;
    private PREFERRED_CAMERA_KEY = 'vh.preferred.camera';
    private PREFERRED_MICROPHONE_KEY = 'vh.preferred.microphone';

    private availableDeviceList: UserMediaDevice[];

    constructor() {
        this.preferredCamCache = new SessionStorage(this.PREFERRED_CAMERA_KEY);
        this.preferredMicCache = new SessionStorage(this.PREFERRED_MICROPHONE_KEY);

        this._navigator.getUserMedia = (this._navigator.getUserMedia || this._navigator.webkitGetUserMedia
            || this._navigator.mozGetUserMedia || this._navigator.msGetUserMedia);

        this._navigator.mediaDevices.ondevicechange = async () => {
            await this.updateAvailableDevicesList();
        };
    }

    async getListOfVideoDevices(): Promise<UserMediaDevice[]> {
        console.info(`getListOfVideoDevices`);
        await this.checkDeviceListIsReady();
        return this.availableDeviceList.filter(x => x.kind === 'videoinput');
    }

    async getListOfMicrophoneDevices(): Promise<UserMediaDevice[]> {
        console.info(`getListOfVideoDevices`);
        await this.checkDeviceListIsReady();
        return this.availableDeviceList.filter(x => x.kind === 'audioinput');
    }

    private async checkDeviceListIsReady() {
        if (!this.availableDeviceList) {
            await this.updateAvailableDevicesList();
        }
    }

    private async updateAvailableDevicesList(): Promise<void> {
        if (!this._navigator.mediaDevices || !this._navigator.mediaDevices.enumerateDevices) {
            console.error('enumerateDevices() not supported.');
            throw new Error('enumerateDevices() not supported.');
        }

        const updatedDevices: MediaDeviceInfo[] = await this._navigator.mediaDevices.enumerateDevices();
        this.availableDeviceList = Array.from(updatedDevices, device =>
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
