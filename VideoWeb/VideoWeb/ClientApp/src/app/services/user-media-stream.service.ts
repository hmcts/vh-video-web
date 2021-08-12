import { Injectable } from '@angular/core';
import 'webrtc-adapter';
import { UserMediaDevice } from '../shared/models/user-media-device';
import { Logger } from './logging/logger-base';
import { ErrorService } from '../services/error.service';
import { CallError } from '../waiting-space/models/video-call-models';
import { from, Observable, ReplaySubject, zip } from 'rxjs';
import { UserMediaService } from './user-media.service';
import { take } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class UserMediaStreamService {

    navigator: Navigator = navigator;
    private readonly loggerPrefix = '[UserMediaStreamService] -';

    private currentStream: MediaStream;
    private currentStreamSubject = new ReplaySubject<MediaStream>(1);
    get currentStream$() {
        return this.currentStreamSubject.asObservable()
    }

    constructor(private logger: Logger, private errorService: ErrorService, private userMediaService :UserMediaService) {
        this.navigator.getUserMedia = this.navigator.getUserMedia || (this.navigator as any).webkitGetUserMedia || (this.navigator as any).msGetUserMedia;
        zip(userMediaService.activeVideoDevice, userMediaService.activeMicrophoneDevice).pipe(take(1)).subscribe((activeDevices => {
            this.initialiseCurrentStream(activeDevices[0], activeDevices[1]);
        }));
    }
    private initialiseCurrentStream(videoDevice: UserMediaDevice, microphone:UserMediaDevice) {
        this.getStreamForCam(videoDevice).pipe(take(1)).subscribe(stream => {
            this.currentStream = stream;
            this.activeMicrophoneChanged(microphone);
        });
        this.userMediaService.activeVideoDevice.subscribe(videoDevice => {
            this.activeCameraChanged(videoDevice);
        });
        this.userMediaService.activeMicrophoneDevice.subscribe(microphoneDevice => {
            this.activeMicrophoneChanged(microphoneDevice);
        });
    }
    private activeCameraChanged(videoDevice: UserMediaDevice) {
        this.getStreamForCam(videoDevice).pipe(take(1)).subscribe(stream => {
            this.currentStream.getVideoTracks().forEach(track => this.currentStream.removeTrack(track));
            stream.getTracks().forEach(track => {
            this.currentStream.addTrack(track);
            });
        })
    }
    private activeMicrophoneChanged(microphoneDevice: UserMediaDevice) {
        this.getStreamForMic(microphoneDevice).pipe(take(1)).subscribe(stream => {
            this.currentStream.getAudioTracks().forEach(track => this.currentStream.removeTrack(track));
            stream.getTracks().forEach(track => {
            this.currentStream.addTrack(track);
            });
        })

    }

    getStreamForMic(device: UserMediaDevice): Observable<MediaStream> {
        try {
            return from(this.navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: device.deviceId } } }));
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Could not get audio stream for microphone`, error);
            this.errorService.handlePexipError(new CallError(error.name), null);
        }
    }

    getStreamForCam(device: UserMediaDevice): Observable<MediaStream> {
        try {
            return from(this.navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: device.deviceId } } }));
            
        } catch (error) {
            this.logger.error(`${this.loggerPrefix} Could not get video stream for camera`, error);
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
