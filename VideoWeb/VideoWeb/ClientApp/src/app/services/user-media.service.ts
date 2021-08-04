import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import 'webrtc-adapter';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { Logger } from './logging/logger-base';
import { SessionStorage } from './session-storage';
import { ErrorService } from '../services/error.service';
import { CallError } from '../waiting-space/models/video-call-models';
import { UserMediaStreamService } from './user-media-stream.service';

@Injectable({
    providedIn: 'root'
})
export class UserMediaService {
    private readonly loggerPrefix = '[UserMediaService] -';
    navigator: Navigator = navigator;

    private readonly preferredCamCache: SessionStorage<UserMediaDevice>;
    private readonly preferredMicCache: SessionStorage<UserMediaDevice>;
    private readonly audioOnlyCache: SessionStorage<boolean>;

    preferredCamSubject$ = new ReplaySubject();
    readonly PREFERRED_CAMERA_KEY = 'vh.preferred.camera';
    readonly PREFERRED_MICROPHONE_KEY = 'vh.preferred.microphone';
    availableDeviceList: UserMediaDevice[];

    connectedDevices: BehaviorSubject<UserMediaDevice[]> = new BehaviorSubject([]);

    constructor(private logger: Logger, private errorService: ErrorService, private userMediaStreamService: UserMediaStreamService) {
        this.preferredCamCache = new SessionStorage(this.PREFERRED_CAMERA_KEY);
        this.preferredMicCache = new SessionStorage(this.PREFERRED_MICROPHONE_KEY);

        this.navigator.mediaDevices.ondevicechange = async () => {
            await this.updateAvailableDevicesList();
        };
    }

    async getListOfVideoDevices(): Promise<UserMediaDevice[]> {
        await this.checkDeviceListIsReady();
        return this.availableDeviceList.filter(x => x.kind === 'videoinput');
    }

    async getListOfMicrophoneDevices(): Promise<UserMediaDevice[]> {
        await this.checkDeviceListIsReady();
        return this.availableDeviceList.filter(x => x.kind === 'audioinput' && x.deviceId !== 'communications');
    }

    async checkDeviceListIsReady() {
        if (!this.availableDeviceList || this.availableDeviceList.length === 0) {
            await this.updateAvailableDevicesList();
        }
    }

    async updateAvailableDevicesList(): Promise<void> {
        if (!this.navigator.mediaDevices || !this.navigator.mediaDevices.enumerateDevices) {
            this.logger.error(`${this.loggerPrefix} enumerateDevices() not supported.`, new Error('enumerateDevices() not supported.'));
        }
        
        this.logger.debug(`${this.loggerPrefix} Attempting to update available media devices.`);
        let updatedDevices: MediaDeviceInfo[] = [];
        const stream: MediaStream = await this.navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (stream && stream.getVideoTracks().length > 0 && stream.getAudioTracks().length > 0) {
            updatedDevices = await this.navigator.mediaDevices.enumerateDevices();
        }
        updatedDevices = updatedDevices.filter(x => x.deviceId !== 'default' && x.kind !== 'audiooutput');
        this.availableDeviceList = Array.from(
            updatedDevices,
            device => new UserMediaDevice(device.label, device.deviceId, device.kind, device.groupId)
        );
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
            });
        }
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
    
    updatePreferredCamera(camera: UserMediaDevice) {
        this.preferredCamCache.set(camera);
        this.logger.info(`${this.loggerPrefix} Updating preferred camera to ${camera.label}`);
    }

    updatePreferredMicrophone(microphone: UserMediaDevice) {
        this.preferredMicCache.set(microphone);
        this.logger.info(`${this.loggerPrefix} Updating preferred microphone to ${microphone.label}`);
    }

    updateAudioOnlyState(isAudioOnly: boolean) {
        this.audioOnlyCache.set(isAudioOnly);
    }

    getAudioOnlyState() {
        return this.audioOnlyCache.get();
    }

    private async getCachedDeviceIfStillConnected(cache: SessionStorage<UserMediaDevice>): Promise<UserMediaDevice> {
        const device = cache.get();
        if (!device) {
            return null;
        }

        await this.checkDeviceListIsReady();

        const stillConnected = this.availableDeviceList.find(x => x.label === device.label);
        if (stillConnected) {
            return device;
        } else {
            this.logger.warn(`${this.loggerPrefix} Preferred device ${device.label} is no longer connected`);
            cache.clear();
            this.errorService.handlePexipError(new CallError('Preferred device is no longer connected'), null);
            return null;
        }
    }

    async setDefaultDevicesInCache() {
        try {
            const cam = await this.getPreferredCamera();
            if (!cam) {
                const cams = await this.getListOfVideoDevices();
                // set first camera in the list as preferred camera if cache is empty
                const firstCam = cams.find(x => x.label.length > 0);
                if (firstCam) {
                    this.logger.info(`${this.loggerPrefix} Setting default camera to ${firstCam.label}`);
                    this.updatePreferredCamera(firstCam);
                }
            }
            const mic = await this.getPreferredMicrophone();
            if (!mic) {
                const mics = await this.getListOfMicrophoneDevices();
                // set first microphone in the list as preferred microphone if cache is empty
                const firstMic = mics.find(x => x.label.length > 0);
                if (firstMic) {
                    this.logger.info(`${this.loggerPrefix} Setting default microphone to ${firstMic.label}`);
                    this.updatePreferredMicrophone(firstMic);
                }
            }
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Failed to set default devices in cache.`, error);
            this.errorService.handlePexipError(new CallError(error.name), null);
        }
    }

    async selectScreenToShare(): Promise<MediaStream> {
        let captureStream = null;
        try {
            const displayOptions = { video: true, audio: true };
            const mediaDevices = navigator.mediaDevices as any;
            captureStream = await mediaDevices.getDisplayMedia(displayOptions);
        } catch (err) {
            this.logger.error(`${this.loggerPrefix} Failed to get a stream for display media`, err);
        }
        return captureStream;
    }
}
