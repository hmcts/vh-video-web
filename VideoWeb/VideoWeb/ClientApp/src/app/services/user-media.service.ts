import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, zip } from 'rxjs';
import 'webrtc-adapter';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { Logger } from './logging/logger-base';
import { SessionStorage } from './session-storage';
import { ErrorService } from '../services/error.service';
import { CallError } from '../waiting-space/models/video-call-models';
import { UserMediaStreamService } from './user-media-stream.service';
import { filter, map, take } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class UserMediaService {
    private readonly loggerPrefix = '[UserMediaService] -';
    navigator: Navigator = navigator;

    private readonly preferredCamCache: SessionStorage<UserMediaDevice>;
    private readonly preferredMicCache: SessionStorage<UserMediaDevice>;

    readonly PREFERRED_CAMERA_KEY = 'vh.preferred.camera';
    readonly PREFERRED_MICROPHONE_KEY = 'vh.preferred.microphone';

    private connectedDevicesSubject: BehaviorSubject<UserMediaDevice[]> = new BehaviorSubject([]);

    constructor(private logger: Logger, private errorService: ErrorService, private userMediaStreamService: UserMediaStreamService) {
        this.preferredCamCache = new SessionStorage(this.PREFERRED_CAMERA_KEY);
        this.preferredMicCache = new SessionStorage(this.PREFERRED_MICROPHONE_KEY);

        this.navigator.mediaDevices.ondevicechange = async () => {
            await this.updateAvailableDevicesList();
            await this.setDevicesInCache();
        };
    }

    get connectedDevices():  Observable<UserMediaDevice[]> {
        return this.connectedDevicesSubject.asObservable();
    }
    get connectedVideoDevices(): Observable<UserMediaDevice[]> {
        return this.connectedDevicesSubject.pipe(
            map(devices => {
                return devices.filter(x => x.kind === 'videoinput');
            })
        );
    }
    get connectedMicrophoneDevices():  Observable<UserMediaDevice[]> {
        return this.connectedDevicesSubject.pipe(
            map(devices => {
                return devices.filter(x => x.kind === 'audioinput' && x.deviceId !== 'communications');
            })
        );
    }

    async updateAvailableDevicesList(): Promise<void> {
        if (!this.navigator.mediaDevices || !this.navigator.mediaDevices.enumerateDevices) {
            const error = new Error('enumerateDevices() not supported.');
            this.logger.error(`${this.loggerPrefix} enumerateDevices() not supported.`, error);
            throw error;
        }

        this.logger.debug(`${this.loggerPrefix} Attempting to update available media devices.`);
        let updatedDevices: MediaDeviceInfo[] = [];
        const stream: MediaStream = await this.navigator.mediaDevices.getUserMedia(this.userMediaStreamService.defaultStreamConstraints);
        if (stream && stream.getVideoTracks().length > 0 && stream.getAudioTracks().length > 0) {
            updatedDevices = await this.navigator.mediaDevices.enumerateDevices();
        }
        updatedDevices = updatedDevices.filter(x => x.deviceId !== 'default' && x.kind !== 'audiooutput');
        var availableDeviceList = Array.from(
            updatedDevices,
            device => new UserMediaDevice(device.label, device.deviceId, device.kind, device.groupId)
        );
        this.userMediaStreamService.stopStream(stream);
        this.connectedDevicesSubject.next(availableDeviceList);
    }

    hasMultipleDevices(): Observable<boolean> {
        return zip(this.connectedVideoDevices, this.connectedMicrophoneDevices).pipe(take(1), map(
            (deviceList) => {
                return deviceList[0].length > 1 || deviceList[1].length > 1;
            }
        ));
    }

    getPreferredCamera() {
        return this.getCachedDevice(this.preferredCamCache);
    }

    getPreferredMicrophone() {
        return this.getCachedDevice(this.preferredMicCache);
    }

    updatePreferredCamera(camera: UserMediaDevice) {
        this.preferredCamCache.set(camera);
        this.logger.info(`${this.loggerPrefix} Updating preferred camera to ${camera.label}`);
    }

    updatePreferredMicrophone(microphone: UserMediaDevice) {
        this.preferredMicCache.set(microphone);
        this.logger.info(`${this.loggerPrefix} Updating preferred microphone to ${microphone.label}`);
    }
    async getCachedDevice(cache: SessionStorage<UserMediaDevice>) {
        return cache.get();
    }
    isDeviceStillConnected(device: UserMediaDevice) {
        return this.connectedDevices.pipe(take(1), map(connectedDevices => {
            return !!connectedDevices.find(x => x.label === device.label);
        }));
    }

    async setDevicesInCache() {
        try {
            const cam = await this.getPreferredCamera();
            if (!cam || !(await this.isDeviceStillConnected(cam))) {
                const cams = await this.connectedVideoDevices.toPromise();
                // set first camera in the list as preferred camera if cache is empty
                const firstCam = cams.find(x => x.label.length > 0);
                if (firstCam) {
                    this.logger.info(`${this.loggerPrefix} Setting default camera to ${firstCam.label}`);
                    this.updatePreferredCamera(firstCam);
                }
            }

            const mic = await this.getPreferredMicrophone();
            if (!mic || !(await this.isDeviceStillConnected(mic))) {
                const mics = await this.connectedMicrophoneDevices.toPromise();
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
