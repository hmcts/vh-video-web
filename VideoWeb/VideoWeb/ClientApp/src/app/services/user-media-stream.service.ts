import { Injectable } from '@angular/core';
import 'webrtc-adapter';
import { UserMediaDevice } from '../shared/models/user-media-device';
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

    private requestStream: MediaStream;

    constructor(private logger: Logger) {
        this.navigator.getUserMedia =
            this.navigator.getUserMedia ||
            this.navigator.webkitGetUserMedia ||
            this.navigator.mozGetUserMedia ||
            this.navigator.msGetUserMedia;
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
            this.logger.error('could not get cam and mic access', exception);
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

        this.requestStream = await this.navigator.mediaDevices.getUserMedia(this.permissionConstraints);
        return this.requestStream;
    }

    async getStreamForMic(device: UserMediaDevice): Promise<MediaStream> {
        if (device) {
            const stream = await this.navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: device.deviceId } } });
            return stream;
        } else {
            return this.getDefaultMicStream();
        }
    }

    async getStreamForCam(device: UserMediaDevice): Promise<MediaStream> {
        if (device) {
            const stream = await this.navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: device.deviceId } } });
            return stream;
        } else {
            return this.getDefaultCamStream();
        }
    }

    private async getDefaultCamStream(): Promise<MediaStream> {
        return await this.navigator.mediaDevices.getUserMedia({
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

    stopStream(stream: MediaStream) {
        if (!stream) {
            return;
        }

        stream.getTracks().forEach((track) => {
            track.stop();
        });
    }
}
