import { Injectable } from '@angular/core';
import 'webrtc-adapter';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { SessionStorage } from './session-storage';
import { Logger } from './logging/logger-base';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UserMediaService {
    navigator = <any>navigator;

    private readonly preferredCamCache: SessionStorage<UserMediaDevice>;
    private readonly preferredMicCache: SessionStorage<UserMediaDevice>;
    readonly PREFERRED_CAMERA_KEY = 'vh.preferred.camera';
    readonly PREFERRED_MICROPHONE_KEY = 'vh.preferred.microphone';

    availableDeviceList: UserMediaDevice[];

    connectedDevices: BehaviorSubject<UserMediaDevice[]> = new BehaviorSubject([]);

    constructor(private logger: Logger) {
        this.preferredCamCache = new SessionStorage(this.PREFERRED_CAMERA_KEY);
        this.preferredMicCache = new SessionStorage(this.PREFERRED_MICROPHONE_KEY);

        this.navigator.getUserMedia =
            this.navigator.getUserMedia ||
            this.navigator.webkitGetUserMedia ||
            this.navigator.mozGetUserMedia ||
            this.navigator.msGetUserMedia;

        this.navigator.mediaDevices.ondevicechange = async () => {
            await this.updateAvailableDevicesList();
        };
    }

    async getListOfVideoDevices(): Promise<UserMediaDevice[]> {
        await this.checkDeviceListIsReady();
        return this.availableDeviceList.filter((x) => x.kind === 'videoinput');
    }

    async getListOfMicrophoneDevices(): Promise<UserMediaDevice[]> {
        await this.checkDeviceListIsReady();
        return this.availableDeviceList.filter((x) => x.kind === 'audioinput');
    }

    async checkDeviceListIsReady() {
        if (!this.availableDeviceList) {
            await this.updateAvailableDevicesList();
        }
    }

    async updateAvailableDevicesList(): Promise<void> {
        if (!this.navigator.mediaDevices || !this.navigator.mediaDevices.enumerateDevices) {
            this.logger.error('enumerateDevices() not supported.', new Error('enumerateDevices() not supported.'));
            throw new Error('enumerateDevices() not supported.');
        }

        let updatedDevices: MediaDeviceInfo[];

        const stream = await this.navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (stream.getVideoTracks().length > 0 && stream.getAudioTracks().length > 0) {
            updatedDevices = await navigator.mediaDevices.enumerateDevices();
        }

        updatedDevices = updatedDevices.filter((x) => x.deviceId !== 'default' && x.kind !== 'audiooutput');
        this.availableDeviceList = Array.from(
            updatedDevices,
            (device) => new UserMediaDevice(device.label, device.deviceId, device.kind, device.groupId)
        );

        stream.getTracks().forEach((track) => {
            track.stop();
        });
        this.connectedDevices.next(this.availableDeviceList);
    }

    async hasMultipleDevices(): Promise<boolean> {
        const camDevices = await this.getListOfVideoDevices();
        const micDevices = await this.getListOfMicrophoneDevices();
        return micDevices.length > 1 || camDevices.length > 1;
    }

    getPreferredCamera() {
        return this.getCachedDeviceIfStillConnected(this.preferredCamCache);
    }

    getPreferredMicrophone() {
        return this.getCachedDeviceIfStillConnected(this.preferredMicCache);
    }

    async getCachedDeviceIfStillConnected(cache: SessionStorage<UserMediaDevice>): Promise<UserMediaDevice> {
        const device = cache.get();
        if (!device) {
            return null;
        }

        await this.checkDeviceListIsReady();

        const stillConnected = this.availableDeviceList.find((x) => x.label === device.label);
        if (stillConnected) {
            return device;
        } else {
            this.logger.warn(`Preferred device ${device.label} is no longer connected`);
            cache.clear();
            return null;
        }
    }

    updatePreferredCamera(camera: UserMediaDevice) {
        this.preferredCamCache.set(camera);
        this.logger.info(`Updating preferred camera to ${camera.label}`);
    }

    updatePreferredMicrophone(microphone: UserMediaDevice) {
        this.preferredMicCache.set(microphone);
        this.logger.info(`Updating preferred microphone to ${microphone.label}`);
    }
}
