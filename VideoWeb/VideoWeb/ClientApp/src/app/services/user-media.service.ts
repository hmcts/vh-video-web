import { Injectable } from '@angular/core';
import { from, Observable, ReplaySubject, zip } from 'rxjs';
import 'webrtc-adapter';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { Logger } from './logging/logger-base';
import { filter, map, mergeMap, retry, take } from 'rxjs/operators';
import { LocalStorageService } from './conference/local-storage.service';

@Injectable({
    providedIn: 'root'
})
export class UserMediaService {
    private readonly loggerPrefix = '[UserMediaService] -';
    readonly defaultStreamConstraints = { audio: true, video: true };
    navigator: Navigator = navigator;

    readonly PREFERRED_CAMERA_KEY = 'vh.preferred.camera';
    readonly PREFERRED_MICROPHONE_KEY = 'vh.preferred.microphone';

    private connectedDevicesSubject: ReplaySubject<UserMediaDevice[]> = new ReplaySubject(1);
    get connectedDevices$(): Observable<UserMediaDevice[]> {
        return this.connectedDevicesSubject.asObservable();
    }

    get connectedVideoDevices(): Observable<UserMediaDevice[]> {
        return this.connectedDevicesSubject.pipe(
            map(devices => {
                return devices.filter(x => x.kind === 'videoinput');
            })
        );
    }

    get connectedMicrophoneDevices(): Observable<UserMediaDevice[]> {
        return this.connectedDevicesSubject.pipe(
            map(devices => {
                return devices.filter(x => x.kind === 'audioinput' && x.deviceId !== 'communications');
            })
        );
    }

    private activeVideoDevice: UserMediaDevice;
    private activeVideoDeviceSubject = new ReplaySubject<UserMediaDevice>(1);
    get activeVideoDevice$(): Observable<UserMediaDevice> {
        return this.activeVideoDeviceSubject.asObservable();
    }

    private activeMicrophoneDevice: UserMediaDevice;
    private activeMicrophoneDeviceSubject = new ReplaySubject<UserMediaDevice>(1);
    get activeMicrophoneDevice$(): Observable<UserMediaDevice> {
        return this.activeMicrophoneDeviceSubject.asObservable();
    }

    private isAudioOnly: boolean = false;
    private isAudioOnlySubject = new ReplaySubject<boolean>(1);
    get isAudioOnly$(): Observable<boolean> {
        return this.isAudioOnlySubject.asObservable();
    }

    constructor(private logger: Logger, /*private errorService: ErrorService,*/ private localStorageService: LocalStorageService) {
        this.handleDeviceChange();

        this.navigator.mediaDevices.ondevicechange = () => {
            this.handleDeviceChange();
        };
    }

    private handleDeviceChange() {
        this.updateAvailableDeviceList().subscribe(availableDevices => {
            this.connectedDevicesSubject.next(availableDevices);

            this.initialiseActiveDevicesFromCache(availableDevices);
            this.checkActiveDevicesAreStillConnected(availableDevices);
        });
    }

    private initialiseActiveDevicesFromCache(availableDevices: UserMediaDevice[]) {
        if (!this.activeVideoDevice) {
            let camera: UserMediaDevice = this.localStorageService.load(this.PREFERRED_CAMERA_KEY);
            if (!camera) {
                camera = this.loadDefaultCamera(availableDevices);
            }

            this.setActiveCamera(camera);
        }

        if (!this.activeMicrophoneDevice) {
            let microphone: UserMediaDevice = this.localStorageService.load(this.PREFERRED_MICROPHONE_KEY);
            if (!microphone) {
                microphone = this.loadDefaultMicrophone(availableDevices);
            }

            this.setActiveMicrophone(microphone);
        }

        this.setIsAudioOnly(false);
    }

    private checkActiveDevicesAreStillConnected(availableDevices: UserMediaDevice[]): void {
        this.activeVideoDevice$.pipe(take(1)).subscribe(activeCamera =>
            this.isDeviceStillConnected(activeCamera)
                .pipe(
                    take(1),
                    filter(stillConnected => !stillConnected)
                )
                .subscribe(() => {
                    const camera = this.loadDefaultCamera(availableDevices);
                    this.setActiveCamera(camera);
                })
        );

        this.activeMicrophoneDevice$.pipe(take(1)).subscribe(activeMicrophone =>
            this.isDeviceStillConnected(activeMicrophone)
                .pipe(
                    take(1),
                    filter(stillConnected => !stillConnected)
                )
                .subscribe(() => {
                    const microphone = this.loadDefaultMicrophone(availableDevices);
                    this.setActiveMicrophone(microphone);
                })
        );
    }

    private loadDefaultCamera(availableDevices: UserMediaDevice[]): UserMediaDevice {
        return availableDevices.filter(device => device.kind === 'videoinput')[0];
    }

    private loadDefaultMicrophone(availableDevices: UserMediaDevice[]): UserMediaDevice {
        return availableDevices.filter(device => device.kind === 'audioinput')[0];
    }

    private updateAvailableDeviceList(): Observable<UserMediaDevice[]> {
        if (!this.navigator.mediaDevices || !this.navigator.mediaDevices.enumerateDevices) {
            const error = new Error('enumerateDevices() not supported.');
            this.logger.error(`${this.loggerPrefix} enumerateDevices() not supported.`, error);
            throw error;
        }

        this.logger.debug(`${this.loggerPrefix} Attempting to update available media devices.`);

        return this.hasValidCameraAndMicAvailable().pipe(
            take(1),
            filter(Boolean),
            mergeMap(() => this.getCameraAndMicrophoneDevices())
        );
    }

    getCameraAndMicrophoneDevices(): Observable<UserMediaDevice[]> {
        return from(this.navigator.mediaDevices.enumerateDevices()).pipe(
            take(1),
            map(devices => devices.filter(x => x.deviceId !== 'default' && (x.kind === 'videoinput' || x.kind === 'audioinput'))),
            map(devices => devices.map(device => new UserMediaDevice(device.label, device.deviceId, device.kind, device.groupId)))
        );
    }

    getCameraDevices(): Observable<UserMediaDevice[]> {
        return this.getCameraAndMicrophoneDevices().pipe(map(devices => devices.filter(device => device.kind === 'videoinput')));
    }

    getMicrophoneDevices(): Observable<UserMediaDevice[]> {
        return this.getCameraAndMicrophoneDevices().pipe(map(devices => devices.filter(device => device.kind === 'audioinput')));
    }

    hasValidCameraAndMicAvailable(): Observable<boolean> {
        // TODO: Have a look at switching to audio only when the video camera is unavailable?
        return from(this.navigator.mediaDevices.getUserMedia(this.defaultStreamConstraints)).pipe(
            retry(3),
            take(1),
            map(stream => !!stream && stream.getVideoTracks().length > 0 && stream.getAudioTracks().length > 0)
        );
    }

    updateActiveMicrophone(microhoneDevice: UserMediaDevice) {
        this.activeMicrophoneDevice$.pipe(take(1)).subscribe(mic => {
            if (mic.deviceId !== microhoneDevice.deviceId) {
                this.setActiveMicrophone(microhoneDevice);
            }
        });
    }

    private setActiveMicrophone(microhoneDevice: UserMediaDevice) {
        if (microhoneDevice) {
            this.activeMicrophoneDevice = microhoneDevice;
            this.activeMicrophoneDeviceSubject.next(microhoneDevice);
            this.localStorageService.save(this.PREFERRED_MICROPHONE_KEY, microhoneDevice);
        }
    }

    updateActiveCamera(cameraDevice: UserMediaDevice) {
        this.activeVideoDevice$.pipe(take(1)).subscribe(cam => {
            if (cam.deviceId !== cameraDevice.deviceId) {
                this.setActiveCamera(cameraDevice);
            }
        });
    }

    private setActiveCamera(cameraDevice: UserMediaDevice) {
        if (cameraDevice) {
            this.activeVideoDevice = cameraDevice;
            this.activeVideoDeviceSubject.next(cameraDevice);
            this.localStorageService.save(this.PREFERRED_CAMERA_KEY, cameraDevice);
        }
    }

    updateIsAudioOnly(audioOnly: boolean) {
        if (this.isAudioOnly !== audioOnly) {
            this.setIsAudioOnly(audioOnly);
        }
    }

    private setIsAudioOnly(audioOnly: boolean) {
        this.isAudioOnly = audioOnly;
        this.isAudioOnlySubject.next(this.isAudioOnly.valueOf());
    }

    hasMultipleDevices(): Observable<boolean> {
        return zip(this.connectedVideoDevices, this.connectedMicrophoneDevices).pipe(
            take(1),
            map(deviceList => {
                return deviceList[0].length > 1 || deviceList[1].length > 1;
            })
        );
    }

    isDeviceStillConnected(device: UserMediaDevice): Observable<boolean> {
        return this.connectedDevices$.pipe(
            take(1),
            map(connectedDevices => {
                return !!connectedDevices.find(x => x.deviceId === device.deviceId);
            })
        );
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
