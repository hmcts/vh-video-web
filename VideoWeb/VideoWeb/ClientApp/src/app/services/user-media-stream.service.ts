import { Injectable } from '@angular/core';
import 'webrtc-adapter';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { Logger } from './logging/logger-base';
import { ErrorService } from '../services/error.service';
import { CallError } from '../waiting-space/models/video-call-models';
import { DeviceTypeService } from './device-type.service';

@Injectable({
    providedIn: 'root'
})
export class UserMediaStreamService {
    readonly permissionConstraints = { audio: true, video: true };
    readonly tabletPermissionConstraints = { audio: true, video: { facingMode: "user" }};
    readonly defaultDesktopCamConstraints = { audio: false, video: true };
    readonly defaultMicConstraints = { audio: true, video: false };
    readonly defaultTabletCamConstraints = { audio: false, video: { facingMode: "user" }};
    navigator = <any>navigator;
    private readonly loggerPrefix = '[UserMediaStreamService] -';

    private requestStream: MediaStream;

    constructor(private logger: Logger, private errorService: ErrorService, private deviceTypeService: DeviceTypeService) {
        this.navigator.getUserMedia = this.navigator.getUserMedia || this.navigator.webkitGetUserMedia || this.navigator.msGetUserMedia;
    }

    async requestAccess(): Promise<boolean> {
        try {
            /*
            If a user grants access a stream is returned, which needs to be closed
            rather than being returned to the client.
            */
            await this.getStream();
            this.stopStream(this.requestStream);
            return true;
        } catch (exception) {
            this.logger.error(`${this.loggerPrefix} Could not get cam and mic access`, exception);
            return false;
        }
    }

    async getStream(): Promise<MediaStream> {
        if (this.requestStream) {
            this.stopStream(this.requestStream);
        }
        try {
            this.requestStream = await this.navigator.mediaDevices.getUserMedia(this.permissionConstraints);
            return this.requestStream;
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Could not get media stream`, error);
            this.errorService.handlePexipError(new CallError(error.name), null);
        }
    }

    async getStreamForMic(device: UserMediaDevice): Promise<MediaStream> {
        try {
            if (device) {
                return await this.navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: device.deviceId } } });
            } else {
                return this.getDefaultMicStream();
            }
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Could not get audio stream for microphone`, error);
            this.errorService.handlePexipError(new CallError(error.name), null);
        }
    }

    async getStreamForCam(device: UserMediaDevice): Promise<MediaStream> {
        try {
            if (device) {
                return await this.navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: device.deviceId } } });
            } else {
                if (this.deviceTypeService.isDesktop) {
                    this.logger.debug(`${this.loggerPrefix} Attempt to get desktop video stream for camera`);
                    return this.getDefaultCamStream();
                } else {
                    this.logger.debug(`${this.loggerPrefix} Attempt to get tablet video stream for camera`);
                    return this.getDefaultTabletCamStream();
                }
            }
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Could not get video stream for camera`, error);
            this.errorService.handlePexipError(new CallError(error.name), null);
        }
    }

    private async getDefaultCamStream(): Promise<MediaStream> {
        return this.navigator.mediaDevices.getUserMedia(this.defaultDesktopCamConstraints);
    }
    private async getDefaultTabletCamStream(): Promise<MediaStream> {
        return this.navigator.mediaDevices.getUserMedia(this.defaultTabletCamConstraints);
    }
    private async getDefaultMicStream(): Promise<MediaStream> {
        return await this.navigator.mediaDevices.getUserMedia(this.defaultMicConstraints);
    }

    stopStream(stream: MediaStream) {
        if (!stream) {
            return;
        }
        stream.getTracks().forEach(track => {
            track.stop();
        });
    }
}