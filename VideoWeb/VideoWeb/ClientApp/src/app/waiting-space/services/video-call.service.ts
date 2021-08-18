import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';
import { Observable, Subject } from 'rxjs';
import { skip, take, takeUntil } from 'rxjs/operators';
import { ConfigService } from 'src/app/services/api/config.service';
import { ApiClient, HearingLayout, SharedParticipantRoom, StartHearingRequest } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { SessionStorage } from 'src/app/services/session-storage';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { UserMediaService } from 'src/app/services/user-media.service';

import {
    CallError,
    CallSetup,
    ConferenceUpdated,
    ConnectedCall,
    ConnectedPresentation,
    ConnectedScreenshare,
    DisconnectedCall,
    DisconnectedPresentation,
    ParticipantUpdated,
    Presentation,
    StoppedScreenshare
} from '../models/video-call-models';

declare var PexRTC: any;

@Injectable()
export class VideoCallService {
    private readonly loggerPrefix = '[VideoCallService] -';
    private readonly preferredLayoutCache: SessionStorage<Record<string, HearingLayout>>;
    readonly VIDEO_CALL_PREFERENCE_KEY = 'vh.videocall.preferences';
    readonly PREFERRED_LAYOUT_KEY = 'vh.preferred.layout';

    readonly callTypeAudioOnly = 'audioonly';

    private onSetupSubject = new Subject<CallSetup>();
    private onConnectedSubject = new Subject<ConnectedCall>();
    private onDisconnected = new Subject<DisconnectedCall>();
    private onErrorSubject = new Subject<CallError>();
    private onCallTransferSubject = new Subject<any>();
    private onParticipantUpdatedSubject = new Subject<ParticipantUpdated>();
    private onConferenceUpdatedSubject = new Subject<ConferenceUpdated>();

    private onConnectedScreenshareSubject = new Subject<ConnectedScreenshare>();
    private onStoppedScreenshareSubject = new Subject<StoppedScreenshare>();
    private onPresentationSubject = new Subject<Presentation>();
    private onConnectedPresentationSubject = new Subject<ConnectedPresentation>();
    private onDisconnectedPresentationSubject = new Subject<DisconnectedPresentation>();

    private hasDisconnected$ = new Subject();

    pexipAPI: PexipClient;
    localOutgoingStream: any;

    constructor(
        private logger: Logger,
        private userMediaService: UserMediaService,
        private userMediaStreamService: UserMediaStreamService,
        private apiClient: ApiClient,
        private configService: ConfigService
    ) {
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
        this.initCallTag();
        this.initTurnServer();
        this.pexipAPI.screenshare_fps = 30;

        this.userMediaStreamService.currentStream$.pipe(take(1)).subscribe(stream => {
            this.pexipAPI.user_media_stream = stream;
            this.userMediaStreamService.currentStream$.pipe(skip(1)).subscribe(stream => this.onCurrentStreamChanged(stream));
        });

        this.pexipAPI.onSetup = function (stream) {
            self.onSetupSubject.next(new CallSetup(stream));
        };

        this.pexipAPI.onConnect = function (stream) {
            self.hasDisconnected$ = new Subject();

            self.userMediaService.isAudioOnly$.pipe(skip(1), takeUntil(self.hasDisconnected$)).subscribe(isAudioOnly => {
                self.onIsAudioOnlyChanged(isAudioOnly);
            });
            self.userMediaStreamService.streamModified$.pipe(takeUntil(self.hasDisconnected$)).subscribe(() => self.onStreamModified());

            self.onConnectedSubject.next(new ConnectedCall(stream));
        };

        this.pexipAPI.onError = function (error) {
            self.onErrorSubject.next(new CallError(error));
        };

        this.pexipAPI.onDisconnect = function (reason) {
            this.hasDisconnected$.next();
            this.hasDisconnected$.complete();

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

        this.pexipAPI.onPresentation = function (setting, presenter, uuid) {
            self.logger.info(`${self.loggerPrefix} Presentation status changed: ${setting}`);
            self.onPresentationSubject.next(new Presentation(setting));
        };

        this.pexipAPI.onPresentationConnected = function (stream) {
            self.logger.info(`${self.loggerPrefix} Presentation connected`);
            self.onConnectedPresentationSubject.next(new ConnectedPresentation(stream));
        };

        this.pexipAPI.onPresentationDisconnected = function (reason) {
            self.logger.info(`${self.loggerPrefix} Presentation disconnected : ${JSON.stringify(reason)}`);
            self.onDisconnectedPresentationSubject.next(new DisconnectedPresentation(reason));
        };

        this.pexipAPI.onScreenshareConnected = function (stream) {
            self.logger.info(`${self.loggerPrefix} Screenshare connected`);
            self.onConnectedScreenshareSubject.next(new ConnectedScreenshare(stream));
        };

        this.pexipAPI.onScreenshareStopped = function (reason) {
            self.logger.info(`${self.loggerPrefix} Screenshare stopped : ${JSON.stringify(reason)}`);
            self.onStoppedScreenshareSubject.next(new StoppedScreenshare(reason));
        };
    }

    private onCurrentStreamChanged(stream: MediaStream) {
        const shouldReconnect = !!this.pexipAPI.user_media_stream && stream !== this.pexipAPI.user_media_stream;
        this.pexipAPI.user_media_stream = stream;

        if (shouldReconnect) {
            this.reconnectToCall();
        }
    }

    private onStreamModified() {
        this.reconnectToCall();
    }

    private onIsAudioOnlyChanged(audioOnly: boolean) {
        this.reconnectToCall(audioOnly ? 'video' : null);
    }

    initTurnServer() {
        const config = this.configService.getConfig();
        const turnServerObj = {
            url: `turn:${config.kinly_turn_server}`,
            username: config.kinly_turn_server_user,
            credential: config.kinly_turn_server_credential
        };
        this.pexipAPI.turn_server = turnServerObj;
    }

    initCallTag() {
        this.pexipAPI.call_tag = Guid.create().toString();
    }

    makeCall(pexipNode: string, conferenceAlias: string, participantDisplayName: string, maxBandwidth: number) {
        this.initCallTag();
        this.pexipAPI.makeCall(pexipNode, conferenceAlias, participantDisplayName, maxBandwidth, null);
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

    onPresentation(): Observable<Presentation> {
        return this.onPresentationSubject.asObservable();
    }

    onPresentationConnected(): Observable<ConnectedPresentation> {
        return this.onConnectedPresentationSubject.asObservable();
    }

    onPresentationDisconnected(): Observable<DisconnectedPresentation> {
        return this.onDisconnectedPresentationSubject.asObservable();
    }

    onScreenshareConnected(): Observable<ConnectedScreenshare> {
        return this.onConnectedScreenshareSubject.asObservable();
    }

    onScreenshareStopped(): Observable<StoppedScreenshare> {
        return this.onStoppedScreenshareSubject.asObservable();
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

    reconnectToCall(callType: string = null) {
        this.pexipAPI.disconnectCall();
        this.pexipAPI.addCall(callType);
    }

    async selectScreen() {
        const displayStream = await this.userMediaService.selectScreenToShare();
        this.pexipAPI.user_presentation_stream = displayStream;
    }

    startScreenShare() {
        this.logger.info(`${this.loggerPrefix} startScreenShare`);
        this.pexipAPI.present('screen');
    }

    stopScreenShare() {
        this.logger.info(`${this.loggerPrefix} stopScreenShare`);
        this.pexipAPI.present(null);
    }

    retrievePresentation() {
        this.logger.info(`${this.loggerPrefix} retrievePresentation`);
        this.pexipAPI.getPresentation();
    }

    stopPresentation() {
        this.logger.info(`${this.loggerPrefix} stopPresentation`);
        this.pexipAPI.stopPresentation();
    }

    retrieveInterpreterRoom(conferenceId: string, participantId: string): Promise<SharedParticipantRoom> {
        this.logger.info(`${this.loggerPrefix} Attempting to retrieve interpreter room for participant`, {
            conference: conferenceId,
            participant: participantId
        });

        return this.apiClient.getParticipantRoomForParticipant(conferenceId, participantId, 'Civilian').toPromise();
    }

    retrieveWitnessInterpreterRoom(conferenceId: string, participantId: string): Promise<SharedParticipantRoom> {
        this.logger.info(`${this.loggerPrefix} Attempting to retrieve interpreter room for participant`, {
            conference: conferenceId,
            participant: participantId
        });

        return this.apiClient.getParticipantRoomForParticipant(conferenceId, participantId, 'Witness').toPromise();
    }

    retrieveJudicialRoom(conferenceId: string, participantId: string): Promise<SharedParticipantRoom> {
        this.logger.info(`${this.loggerPrefix} Attempting to retrieve judicial room for participant`, {
            conference: conferenceId,
            participant: participantId
        });

        return this.apiClient.getParticipantRoomForParticipant(conferenceId, participantId, 'Judicial').toPromise();
    }
}
