import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ApiClient, HearingLayout, StartHearingRequest } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { SessionStorage } from 'src/app/services/session-storage';
import { UserMediaService } from 'src/app/services/user-media.service';
import { UserMediaDevice } from 'src/app/shared/models/user-media-device';
import { CallError, CallSetup, ConferenceUpdated, ConnectedCall, DisconnectedCall, ParticipantUpdated } from '../models/video-call-models';

declare var PexRTC: any;

@Injectable()
export class VideoCallService {
    private readonly preferredLayoutCache: SessionStorage<Record<string, HearingLayout>>;
    readonly PREFERRED_LAYOUT_KEY = 'vh.preferred.layout';

    private onSetupSubject = new Subject<CallSetup>();
    private onConnectedSubject = new Subject<ConnectedCall>();
    private onDisconnected = new Subject<DisconnectedCall>();
    private onErrorSubject = new Subject<CallError>();
    private onCallTransferSubject = new Subject<any>();
    private onParticipantUpdatedSubject = new Subject<ParticipantUpdated>();
    private onConferenceUpdatedSubject = new Subject<ConferenceUpdated>();

    pexipAPI: PexipClient;

    constructor(private logger: Logger, private userMediaService: UserMediaService, private apiClient: ApiClient) {
        this.preferredLayoutCache = new SessionStorage(this.PREFERRED_LAYOUT_KEY);
        if (!this.preferredLayoutCache.get()) {
            this.preferredLayoutCache.set({});
        }
    }

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

        this.pexipAPI.onParticipantUpdate = function (participantUpdate) {
            self.onParticipantUpdatedSubject.next(
                new ParticipantUpdated(
                    participantUpdate.is_muted,
                    participantUpdate.buzz_time,
                    participantUpdate.display_name,
                    participantUpdate.uuid,
                    participantUpdate.spotlight
                )
            );
        };

        this.pexipAPI.onConferenceUpdate = function (conferenceUpdate) {
            self.onConferenceUpdatedSubject.next(new ConferenceUpdated(conferenceUpdate.guests_muted));
        };

        this.pexipAPI.onCallTransfer = function (alias) {
            self.onCallTransferSubject.next(alias);
        };
    }

    public async retrievePreferredDevices() {
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

    onCallTransferred(): Observable<any> {
        return this.onCallTransferSubject.asObservable();
    }

    onError(): Observable<CallError> {
        return this.onErrorSubject.asObservable();
    }

    onParticipantUpdated(): Observable<ParticipantUpdated> {
        return this.onParticipantUpdatedSubject.asObservable();
    }

    onConferenceUpdated(): Observable<ConferenceUpdated> {
        return this.onConferenceUpdatedSubject.asObservable();
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

    muteParticipant(participantId: string, mute: boolean) {
        this.pexipAPI.setParticipantMute(participantId, mute);
    }

    spotlightParticipant(participantId: string, spotlight: boolean) {
        this.pexipAPI.setParticipantSpotlight(participantId, spotlight);
    }

    muteAllParticipants(mute: boolean) {
        this.pexipAPI.setMuteAllGuests(mute);
    }

    enableH264(enable: boolean) {
        this.pexipAPI.h264_enabled = enable;
    }

    raiseHand() {
        this.pexipAPI.setBuzz();
    }

    lowerHand() {
        this.pexipAPI.clearBuzz();
    }

    lowerHandById(uuid: string) {
        this.pexipAPI.clearBuzz(uuid);
    }

    lowerAllHands() {
        this.pexipAPI.clearAllBuzz();
    }

    updatePreferredLayout(conferenceId: string, layout: HearingLayout) {
        const record = this.preferredLayoutCache.get();
        record[conferenceId] = layout;
        this.preferredLayoutCache.set(record);
    }

    getPreferredLayout(conferenceId: string) {
        const record = this.preferredLayoutCache.get();
        return record[conferenceId];
    }

    async startHearing(conferenceId: string, layout: HearingLayout) {
        const request = new StartHearingRequest({
            layout: layout
        });
        await this.apiClient.startOrResumeVideoHearing(conferenceId, request).toPromise();
    }

    async pauseHearing(conferenceId: string) {
        await this.apiClient.pauseVideoHearing(conferenceId).toPromise();
    }

    async endHearing(conferenceId: string) {
        await this.apiClient.endVideoHearing(conferenceId).toPromise();
    }
}
