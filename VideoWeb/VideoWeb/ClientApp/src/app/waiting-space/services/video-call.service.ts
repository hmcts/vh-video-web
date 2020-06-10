import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaService } from 'src/app/services/user-media.service';
import { UserMediaDevice } from 'src/app/shared/models/user-media-device';
import { CallError, CallSetup, ConnectedCall, DisconnectedCall } from '../models/video-call-models';

declare var PexRTC: any;

@Injectable()
export class VideoCallService {
    private onSetupSubject = new Subject<CallSetup>();
    private onConnectedSubject = new Subject<ConnectedCall>();
    private onDisconnected = new Subject<DisconnectedCall>();
    private onErrorSubject = new Subject<CallError>();

    pexipAPI: any;

    constructor(private logger: Logger, private userMediaService: UserMediaService) {}

    /**
     * This will initialise the pexip client and initalise the call with
     * the user's preferred camera and microphone (if selected)
     */
    async setupClient() {
        const self = this;
        this.pexipAPI = new PexRTC();
        await this.retrievePreferredDevices();

        this.pexipAPI.onSetup = function (stream, pinStatus, conferenceExtension) {
            self.onSetupSubject.next(new CallSetup(stream));
        };

        this.pexipAPI.onConnect = function (stream) {
            self.onConnectedSubject.next(new ConnectedCall(stream));
        };

        this.pexipAPI.onError = function (error) {
            self.onErrorSubject.next(new CallError(error));
        };

        this.pexipAPI.onDisconnect = function (reason) {
            self.onDisconnected.next(new DisconnectedCall(reason));
        };
    }

    private async retrievePreferredDevices() {
        const preferredCam = await this.userMediaService.getPreferredCamera();
        if (preferredCam) {
            this.updateCameraForCall(preferredCam);
        }

        const preferredMic = await this.userMediaService.getPreferredMicrophone();
        if (preferredMic) {
            this.updateMicrophoneForCall(preferredMic);
        }
    }

    /**
     *
     * @param pexipNode the node hosting the pexip server
     * @param conferenceAlias the participant uri
     * @param participantDisplayName the tiled display name (i.e. tile position and display name for video call)
     * @param maxBandwidth the maximum bandwith
     */
    makeCall(pexipNode: string, conferenceAlias: string, participantDisplayName: string, maxBandwidth: number) {
        this.pexipAPI.makeCall(pexipNode, conferenceAlias, participantDisplayName, maxBandwidth);
    }

    disconnectFromCall() {
        if (this.pexipAPI) {
            this.logger.info('disconnecting from pexip node');
            this.pexipAPI.disconnect();
        } else {
            throw new Error('Pexip Client has not been initialised');
        }
    }

    connect(pin: string, extension: string) {
        this.pexipAPI.connect(pin, extension);
    }

    onCallSetup(): Observable<CallSetup> {
        return this.onSetupSubject.asObservable();
    }

    onCallConnected(): Observable<ConnectedCall> {
        return this.onConnectedSubject.asObservable();
    }

    onCallDisconnected(): Observable<DisconnectedCall> {
        return this.onDisconnected.asObservable();
    }

    onError(): Observable<CallError> {
        return this.onErrorSubject.asObservable();
    }

    updateCameraForCall(camera: UserMediaDevice) {
        this.pexipAPI.video_source = camera.deviceId;
        this.logger.info(`Using preferred camera: ${camera.label}`);
    }

    updateMicrophoneForCall(microphone: UserMediaDevice) {
        this.pexipAPI.audio_source = microphone.deviceId;
        this.logger.info(`Using preferred microphone: ${microphone.label}`);
    }

    toggleMute(): boolean {
        return this.pexipAPI.muteAudio();
    }

    enableH264(enable: boolean) {
        this.pexipAPI.h264_enabled = enable;
    }
}
