import { Injectable } from '@angular/core';
import 'webrtc-adapter';
import { ErrorService } from '../services/error.service';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { CallError } from '../waiting-space/models/video-call-models';
import { Logger } from './logging/logger-base';

@Injectable({
    providedIn: 'root'
})
export class UserMediaStreamService {
    readonly permissionConstraints = {
        audio: true,
        video: true
    };

    navigator = <any>navigator;
    private readonly loggerPrefix = '[UserMediaStreamService] -';

    private requestStream: MediaStream;

    constructor(private logger: Logger, private errorService: ErrorService) {
        this.navigator.getUserMedia = this.navigator.getUserMedia || this.navigator.webkitGetUserMedia || this.navigator.msGetUserMedia;
    }

    async requestAccess(): Promise<boolean> {
        try {
            /*
            If a user grants access a stream is returned, which needs to be closed
            rather than being returned to the client.
            */
            await this.getStream();
            this.stopRequestStream();
            return true;
        } catch (exception) {
            this.logger.error(`${this.loggerPrefix} Could not get cam and mic access`, exception);
            return false;
        }
    }

    private stopRequestStream() {
        this.stopStream(this.requestStream);
    }

    private async getStream(): Promise<MediaStream> {
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
                this.logger.debug(`${this.loggerPrefix} Getting stream for microphone device ${device.label}`);
                return await this.navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: device.deviceId } } });
            } else {
                this.logger.debug(
                    `${this.loggerPrefix} No device provided, getting a default stream for microphone device ${device.label}`
                );
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
                this.logger.debug(`${this.loggerPrefix} Getting stream for camera device ${device.label}`);
                return await this.navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: device.deviceId } } });
            } else {
                this.logger.debug(`${this.loggerPrefix} No device provided, getting a default stream for camera device ${device.label}`);
                return this.getDefaultCamStream();
            }
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Could not get video stream for camera`, error);
            this.errorService.handlePexipError(new CallError(error.name), null);
        }
    }

    private async getDefaultCamStream(): Promise<MediaStream> {
        return this.navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true
        });
    }

    private async getDefaultMicStream(): Promise<MediaStream> {
        return await this.navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
        });
    }

    async getSreamForPreferredDevices(cam: UserMediaDevice, mic: UserMediaDevice): Promise<MediaStream> {
        this.logger.debug(`${this.loggerPrefix} Getting stream for preferrerd devices`, { cam, mic });
        return await this.navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: cam?.deviceId } },
            audio: { deviceId: { exact: mic?.deviceId } }
        });
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
