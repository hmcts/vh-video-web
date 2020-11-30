import { Injectable } from '@angular/core';
import 'webrtc-adapter';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { Logger } from './logging/logger-base';
import { ErrorService } from '../services/error.service';
import { CallError } from '../waiting-space/models/video-call-models';

@Injectable({
    providedIn: 'root'
})
export class UserMediaStreamService {
    readonly permissionConstraints = {
        audio: true,
        video: true
    };

    navigator = <any>navigator;

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
            this.logger.error('[UserMediaStreamService] - Could not get cam and mic access', exception);
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
            this.logger.error('[UserMediaStreamService] - Could not get media stream', error);
            this.errorService.handlePexipError(new CallError(error.name), null);
        }
    }

    async getStreamForMic(device: UserMediaDevice): Promise<MediaStream> {
        if (device) {
            try {
                const stream = await this.navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: device.deviceId } } });
                return stream;
            } catch (error) {
                this.logger.error('[UserMediaStreamService] - Could not get audio stream for microphone', error);
                this.errorService.handlePexipError(new CallError(error.name), null);
            }
        } else {
            return this.getDefaultMicStream();
        }
    }

    async getStreamForCam(device: UserMediaDevice): Promise<MediaStream> {
        if (device) {
            try {
                const stream = await this.navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: device.deviceId } } });
                return stream;
            } catch (error) {
                this.logger.error('[UserMediaStreamService] - Could not get video stream for camera', error);
                this.errorService.handlePexipError(new CallError(error.name), null);
            }
        } else {
            return this.getDefaultCamStream();
        }
    }

    private async getDefaultCamStream(): Promise<MediaStream> {
        try {
            return await this.navigator.mediaDevices.getUserMedia({
                audio: false,
                video: true
            });
        } catch (error) {
            this.logger.error('[UserMediaStreamService] - Could not get default video stream for camera', error);
            this.errorService.handlePexipError(new CallError(error.name), null);
        }
    }

    private async getDefaultMicStream(): Promise<MediaStream> {
        try {
            return await this.navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });
        } catch (error) {
            this.logger.error('[UserMediaStreamService] - Could not get default audio stream for microphone', error);
            this.errorService.handlePexipError(new CallError(error.name), null);
        }
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
