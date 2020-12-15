import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';
import { Observable, Subject } from 'rxjs';
import { ApiClient, HearingLayout, StartHearingRequest } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { SessionStorage } from 'src/app/services/session-storage';
import { UserMediaService } from 'src/app/services/user-media.service';
import { UserMediaDevice } from 'src/app/shared/models/user-media-device';
import { CallError, CallSetup, ConferenceUpdated, ConnectedCall, DisconnectedCall, ParticipantUpdated } from '../models/video-call-models';
import { VideoCallPreferences } from './video-call-preferences.mode';

declare var PexRTC: any;

@Injectable()
export class VideoCallService {
    private readonly loggerPrefix = '[VideoCallService] -';
    private readonly preferredLayoutCache: SessionStorage<Record<string, HearingLayout>>;
    private readonly videoCallPreferences: SessionStorage<VideoCallPreferences>;
    readonly VIDEO_CALL_PREFERENCE_KEY = 'vh.videocall.preferences';
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
        this.videoCallPreferences = new SessionStorage(this.VIDEO_CALL_PREFERENCE_KEY);
        if (!this.preferredLayoutCache.get()) {
            this.preferredLayoutCache.set({});
        }
        if (!this.videoCallPreferences.get()) {
            this.videoCallPreferences.set(new VideoCallPreferences());
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
        this.initCallTag();

        this.pexipAPI.onSetup = function (stream, pinStatus, conferenceExtension) {
            // Although a participant may connect as audio only, they should still be able to see the video hearing like anyone else
            self.pexipAPI.call.recv_video = true;
            self.pexipAPI.call.video_source = self.pexipAPI.video_source;
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
            self.onParticipantUpdatedSubject.next(ParticipantUpdated.fromPexipParticipant(participantUpdate));
        };

        this.pexipAPI.onConferenceUpdate = function (conferenceUpdate) {
            self.onConferenceUpdatedSubject.next(new ConferenceUpdated(conferenceUpdate.guests_muted));
        };

        this.pexipAPI.onCallTransfer = function (alias) {
            self.onCallTransferSubject.next(alias);
        };
    }

    initCallTag() {
        this.pexipAPI.call_tag = Guid.create().toString();
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
    makeCall(pexipNode: string, conferenceAlias: string, participantDisplayName: string, maxBandwidth: number, audioOnly: boolean = false) {
        this.initCallTag();
        const callType = audioOnly ? 'audioonly' : null;
        this.pexipAPI.makeCall(pexipNode, conferenceAlias, participantDisplayName, maxBandwidth, callType);
    }

    disconnectFromCall() {
        if (this.pexipAPI) {
            this.logger.info(`${this.loggerPrefix} Disconnecting from pexip node.`);
            this.pexipAPI.disconnect();
        } else {
            throw new Error(`${this.loggerPrefix} Pexip Client has not been initialised.`);
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
        this.logger.info(`${this.loggerPrefix}  Using preferred camera: ${camera.label}`);
    }

    updateMicrophoneForCall(microphone: UserMediaDevice) {
        this.pexipAPI.audio_source = microphone.deviceId;
        this.logger.info(`${this.loggerPrefix} Using preferred microphone: ${microphone.label}`);
    }

    toggleMute(conferenceId: string, participantId: string): boolean {
        this.logger.info(`${this.loggerPrefix} Toggling mute`, {
            currentAudioMuteStatus: this.pexipAPI.mutedAudio,
            currentVideoMuteStatus: this.pexipAPI.mutedVideo,
            conference: conferenceId,
            participant: participantId
        });
        return this.pexipAPI.muteAudio();
    }

    toggleVideo(conferenceId: string, participantId: string): boolean {
        this.logger.info(`${this.loggerPrefix} Toggling outgoing video`, {
            currentAudioMuteStatus: this.pexipAPI.mutedAudio,
            currentVideoMuteStatus: this.pexipAPI.mutedVideo,
            conference: conferenceId,
            participant: participantId
        });
        return this.pexipAPI.muteVideo();
    }

    muteParticipant(pexipParticipantId: string, mute: boolean, conferenceId: string, participantId: string) {
        this.logger.info(`${this.loggerPrefix} Attempting to set participant status`, {
            muteEnabled: mute,
            pexipParticipant: pexipParticipantId,
            conference: conferenceId,
            participant: participantId
        });
        this.pexipAPI.setParticipantMute(pexipParticipantId, mute);
    }

    spotlightParticipant(pexipParticipantId: string, spotlight: boolean, conferenceId: string, participantId: string) {
        this.logger.info(`${this.loggerPrefix} Attempting to set participant spotlight`, {
            spotlightEnabled: spotlight,
            pexipParticipant: pexipParticipantId,
            conference: conferenceId,
            participant: participantId
        });
        this.pexipAPI.setParticipantSpotlight(pexipParticipantId, spotlight);
    }

    muteAllParticipants(mute: boolean, conferenceId: string) {
        this.logger.info(`${this.loggerPrefix} Attempting to mute all participants`, { conference: conferenceId });
        this.pexipAPI.setMuteAllGuests(mute);
    }

    enableH264(enable: boolean) {
        this.pexipAPI.h264_enabled = enable;
    }

    raiseHand(conferenceId: string, participantId: string) {
        this.logger.info(`${this.loggerPrefix} Attempting to raise own hand`, { conference: conferenceId, participant: participantId });
        this.pexipAPI.setBuzz();
    }

    lowerHand(conferenceId: string, participantId: string) {
        this.logger.info(`${this.loggerPrefix} Attempting to lower own hand`, { conference: conferenceId, participant: participantId });
        this.pexipAPI.clearBuzz();
    }

    lowerHandById(pexipParticipantId: string, conferenceId: string, participantId: string) {
        this.logger.info(`${this.loggerPrefix} Attempting to mute all participants`, {
            pexipId: pexipParticipantId,
            conference: conferenceId,
            participant: participantId
        });
        this.pexipAPI.clearBuzz(pexipParticipantId);
    }

    lowerAllHands(conferenceId: string) {
        this.logger.info(`${this.loggerPrefix} Attempting to lower hand for all participants`, { conference: conferenceId });
        this.pexipAPI.clearAllBuzz();
    }

    updatePreferredLayout(conferenceId: string, layout: HearingLayout) {
        this.logger.info(`${this.loggerPrefix} Updating preferred layout`, { conference: conferenceId, layout });
        const record = this.preferredLayoutCache.get();
        record[conferenceId] = layout;
        this.preferredLayoutCache.set(record);
    }

    getPreferredLayout(conferenceId: string) {
        const record = this.preferredLayoutCache.get();
        return record[conferenceId];
    }

    startHearing(conferenceId: string, layout: HearingLayout): Promise<void> {
        this.logger.info(`${this.loggerPrefix} Attempting to start hearing`, { conference: conferenceId, layout });
        const request = new StartHearingRequest({
            layout: layout
        });
        return this.apiClient.startOrResumeVideoHearing(conferenceId, request).toPromise();
    }

    pauseHearing(conferenceId: string): Promise<void> {
        this.logger.info(`${this.loggerPrefix} Attempting to pause hearing`, { conference: conferenceId });
        return this.apiClient.pauseVideoHearing(conferenceId).toPromise();
    }

    endHearing(conferenceId: string): Promise<void> {
        this.logger.info(`${this.loggerPrefix} Attempting to end hearing`, { conference: conferenceId });
        return this.apiClient.endVideoHearing(conferenceId).toPromise();
    }

    async callParticipantIntoHearing(conferenceId: string, participantId: string) {
        this.logger.info(`${this.loggerPrefix} Attempting to call participant into hearing`, {
            conference: conferenceId,
            participant: participantId
        });
        return this.apiClient.callWitness(conferenceId, participantId).toPromise();
    }

    async dismissParticipantFromHearing(conferenceId: string, participantId: string) {
        this.logger.info(`${this.loggerPrefix} Attempting to dismiss participant from hearing`, {
            conference: conferenceId,
            participant: participantId
        });
        return this.apiClient.dismissWitness(conferenceId, participantId).toPromise();
    }

    retrieveVideoCallPreferences(): VideoCallPreferences {
        return this.videoCallPreferences.get();
    }

    updateVideoCallPreferences(updatedPreferences: VideoCallPreferences) {
        this.videoCallPreferences.set(updatedPreferences);
    }
}
