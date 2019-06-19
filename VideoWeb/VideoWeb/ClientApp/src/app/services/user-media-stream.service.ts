import { Injectable, } from '@angular/core';
import 'webrtc-adapter';
import { UserMediaDevice } from '../shared/models/user-media-device';

@Injectable({
    providedIn: 'root',
})
export class UserMediaStreamService {

    readonly permissionConstraints = {
        audio: true,
        video: true
    };

    _navigator = <any>navigator;

    private requestStream: MediaStream;

    constructor() {
        this._navigator.getUserMedia = (this._navigator.getUserMedia || this._navigator.webkitGetUserMedia
            || this._navigator.mozGetUserMedia || this._navigator.msGetUserMedia);
    }

    async requestAccess(): Promise<boolean> {
        try {
            await this.getStream();
            return true;
        } catch (exception) {
            console.error(`could not get cam and mic access because ${exception}`);
            return false;
        }
    }

    stopRequestStream() {
        this.stopStream(this.requestStream);
    }

    private async getStream(): Promise<MediaStream> {
        if (this.requestStream) {
            this.stopStream(this.requestStream);
        }

        this.requestStream = await this._navigator.mediaDevices.getUserMedia(this.permissionConstraints);
        return this.requestStream;
    }

    async getStreamForMic(device: UserMediaDevice): Promise<MediaStream> {
        if (device) {
            console.log(`using preferred mic ${device.label}`);
            const stream = await this._navigator.mediaDevices.getUserMedia(
                { audio: { deviceId: { exact: device.deviceId } } }
            );
            return stream;
        } else {
            console.log(`using default mic`);
            return this.getDefaultMicStream();
        }
    }

    async getStreamForCam(device: UserMediaDevice): Promise<MediaStream> {
        if (device) {
            console.log(`using preferred cam ${device.label}`);
            const stream = await this._navigator.mediaDevices.getUserMedia(
                { video: { deviceId: { exact: device.deviceId } } }
            );
            return stream;
        } else {
            console.log(`using default mic`);
            return this.getDefaultCamStream();
        }
    }


    private async getDefaultCamStream(): Promise<MediaStream> {
        return await this._navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true
        });
    }

    private async getDefaultMicStream(): Promise<MediaStream> {
        return await this._navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
        });
    }

    stopStream(stream: MediaStream) {
        if (!stream) {
            return;
        }

        stream.getAudioTracks().forEach((track) => {
            track.stop();
        });
        stream.getVideoTracks().forEach((track) => {
            track.stop();
        });
    }
}
