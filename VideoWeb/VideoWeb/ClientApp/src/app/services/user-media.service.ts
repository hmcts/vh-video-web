import { Injectable } from '@angular/core';
import { from, Observable, of, ReplaySubject, zip } from 'rxjs';
import 'webrtc-adapter';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { Logger } from './logging/logger-base';
import { catchError, filter, map, mergeMap, retry, take } from 'rxjs/operators';
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

    get connectedVideoDevices$(): Observable<UserMediaDevice[]> {
        return this.connectedDevicesSubject.pipe(
            map(devices => {
                return devices.filter(x => x.kind === 'videoinput');
            })
        );
    }

    get connectedMicrophoneDevices$(): Observable<UserMediaDevice[]> {
        return this.connectedDevicesSubject.pipe(
            map(devices => {
                return devices.filter(x => x.kind === 'audioinput');
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

    private isAudioOnly = false;
    private isAudioOnlySubject = new ReplaySubject<boolean>(1);
    get isAudioOnly$(): Observable<boolean> {
        return this.isAudioOnlySubject.asObservable();
    }

    constructor(private logger: Logger, private localStorageService: LocalStorageService) {}

    private initialised = false;
    initialise() {
        if (!this.initialised) {
            this.logger.debug(`${this.loggerPrefix} Initialising user media service.`);
            this.handleDeviceChange();

            this.navigator.mediaDevices.ondevicechange = () => {
                this.handleDeviceChange();
            };

            this.initialised = true;
        }
    }

    private handleDeviceChange() {
        this.logger.debug(`${this.loggerPrefix} handle device change`);
        this.updateAvailableDeviceList().subscribe(availableDevices => {
            this.connectedDevicesSubject.next(availableDevices);

            this.initialiseActiveDevicesFromCache(availableDevices);
            this.checkActiveDevicesAreStillConnected(availableDevices);
        });
    }

    private initialiseActiveDevicesFromCache(availableDevices: UserMediaDevice[]) {
        this.logger.debug(`${this.loggerPrefix} initialise active devices from cache`);

        if (!this.activeVideoDevice) {
            let camera: UserMediaDevice = this.localStorageService.load(this.PREFERRED_CAMERA_KEY);
            if (!camera || !availableDevices.find(device => device.deviceId === camera.deviceId)) {
                this.logger.debug(
                    `${this.loggerPrefix} no camera cached or cached camera cannot be found. Attempting to load default camera`,
                    { camera }
                );

                camera = this.loadDefaultCamera(availableDevices);
            }

            this.setActiveCamera(camera);
        }

        if (!this.activeMicrophoneDevice) {
            let microphone: UserMediaDevice = this.localStorageService.load(this.PREFERRED_MICROPHONE_KEY);
            if (!microphone || !availableDevices.find(device => device.deviceId === microphone.deviceId)) {
                this.logger.debug(
                    `${this.loggerPrefix} no microphone cached or cached microphone cannot be found. Attempting to load default microphone`,
                    { microphone }
                );
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
                    this.logger.debug(`${this.loggerPrefix} camera disconnected. Attempting to set default camera to cache`, {
                        activeCamera
                    });

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
                    this.logger.debug(`${this.loggerPrefix} microphone disconnected. Attempting to set default camera to cache`, {
                        activeMicrophone
                    });

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
            map(devices => {
                const filteredDevices = devices.filter(
                    x => x.deviceId !== 'default' && x.deviceId !== 'communications' && (x.kind === 'videoinput' || x.kind === 'audioinput')
                );

                return filteredDevices.length > 0 ? filteredDevices : devices;
            }),
            map(devices => devices.map(device => new UserMediaDevice(device.label, device.deviceId, device.kind, device.groupId)))
        );
    }

    hasValidCameraAndMicAvailable(): Observable<boolean> {
        return from(this.navigator.mediaDevices.getUserMedia(this.defaultStreamConstraints)).pipe(
            retry(3),
            take(1),
            map(stream => !!stream && stream.getVideoTracks().length > 0 && stream.getAudioTracks().length > 0),
            catchError(error => {
                this.logger.error(`${this.loggerPrefix} couldn't get a valid camera and microphone`, error);
                return of(false);
            })
        );
    }

    updateActiveMicrophone(microhoneDevice: UserMediaDevice) {
        this.logger.debug(`${this.loggerPrefix} Attempting to update available active microphone.`);

        this.activeMicrophoneDevice$.pipe(take(1)).subscribe(mic => {
            if (mic.deviceId !== microhoneDevice.deviceId) {
                this.setActiveMicrophone(microhoneDevice);
            }
        });
    }

    private setActiveMicrophone(microhoneDevice: UserMediaDevice) {
        this.logger.debug(`${this.loggerPrefix} Attempting to set active microhone.`, { microhoneDevice });

        if (microhoneDevice) {
            this.activeMicrophoneDevice = microhoneDevice;
            this.activeMicrophoneDeviceSubject.next(microhoneDevice);

            this.localStorageService.save(this.PREFERRED_MICROPHONE_KEY, microhoneDevice);
        }
    }

    updateActiveCamera(cameraDevice: UserMediaDevice) {
        this.logger.debug(`${this.loggerPrefix} Attempting to update available active camera.`);

        this.activeVideoDevice$.pipe(take(1)).subscribe(cam => {
            if (cam.deviceId !== cameraDevice.deviceId) {
                this.setActiveCamera(cameraDevice);
            }
        });
    }

    private setActiveCamera(cameraDevice: UserMediaDevice) {
        this.logger.debug(`${this.loggerPrefix} Attempting to set active camera.`, { cameraDevice });

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
        this.logger.debug(`${this.loggerPrefix} Attempting to set audioOnly.`, { audioOnly });

        this.isAudioOnly = audioOnly;
        this.isAudioOnlySubject.next(this.isAudioOnly);
    }

    hasMultipleDevices(): Observable<boolean> {
        return zip(this.connectedVideoDevices$, this.connectedMicrophoneDevices$).pipe(
            map(deviceList => {
                return deviceList[0].length > 1 || deviceList[1].length > 1;
            })
        );
    }

    isDeviceStillConnected(device: UserMediaDevice): Observable<boolean> {
        return this.connectedDevices$.pipe(
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
