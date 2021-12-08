import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';
import { BROWSERS } from 'ngx-device-detector';
import { Observable, Subject, Subscription } from 'rxjs';
import { skip, take, takeUntil } from 'rxjs/operators';
import { ConfigService } from 'src/app/services/api/config.service';
import { ApiClient, HearingLayout, SharedParticipantRoom, StartHearingRequest } from 'src/app/services/clients/api-client';
import { KinlyHeartbeatService } from 'src/app/services/conference/kinly-heartbeat.service';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { SessionStorage } from 'src/app/services/session-storage';
import { StreamMixerService } from 'src/app/services/stream-mixer.service';
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
import { VideoCallEventsService } from './video-call-events.service';

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
    private onParticipantCreatedSubject = new Subject<ParticipantUpdated>();
    private onParticipantDeletedSubject = new Subject<Guid>();
    private onConferenceUpdatedSubject = new Subject<ConferenceUpdated>();

    private onConnectedScreenshareSubject = new Subject<ConnectedScreenshare>();
    private onStoppedScreenshareSubject = new Subject<StoppedScreenshare>();
    private onPresentationSubject = new Subject<Presentation>();
    private onConnectedPresentationSubject = new Subject<ConnectedPresentation>();
    private onDisconnectedPresentationSubject = new Subject<DisconnectedPresentation>();

    private onVideoEvidenceSharedSubject = new Subject<void>();
    private onVideoEvidenceStoppedSubject = new Subject<void>();

    private hasDisconnected$ = new Subject();
    private renegotiating = false;
    private justRenegotiated = false;
    private readonly pexipParticipantEventType = 'PexipParticipantUpdate';

    pexipAPI: PexipClient;
    streamModifiedSubscription: Subscription;
    private _displayStream: MediaStream;

    constructor(
        private logger: Logger,
        private userMediaService: UserMediaService,
        private userMediaStreamService: UserMediaStreamService,
        private apiClient: ApiClient,
        private configService: ConfigService,
        private kinlyHeartbeatService: KinlyHeartbeatService,
        private videoCallEventsService: VideoCallEventsService,
        private streamMixerService: StreamMixerService,
        private deviceTypeService: DeviceTypeService
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
    async setupClient(): Promise<void> {
        this.hasDisconnected$ = new Subject();

        const self = this;
        this.pexipAPI = new PexRTC();
        this.initCallTag();
        this.initTurnServer();
        this.pexipAPI.screenshare_fps = 30;

        this.pexipAPI.onLog = (message: string, ...args: any[]) => {
            const pexipLoggerPrefix = '[PexipApi] - ';
            this.logger.pexRtcInfo(`${pexipLoggerPrefix} ${message}`, ...args);
        };

        this.userMediaService.initialise();
        this.logger.debug(`${this.loggerPrefix} attempting to setup user media stream`);
        this.pexipAPI.user_media_stream = await this.userMediaStreamService.currentStream$.pipe(take(1)).toPromise();
        this.logger.debug(`${this.loggerPrefix} set user media stream`);

        this.pexipAPI.onSetup = this.handleSetup.bind(this);

        this.pexipAPI.onConnect = this.handleConnect.bind(this);

        this.pexipAPI.onError = this.handleError.bind(this);

        // Handles server issued disconections - NOT CLIENT
        // https://docs.pexip.com/api_client/api_pexrtc.htm#disconnect
        this.pexipAPI.onDisconnect = this.handleServerDisconnect.bind(this);

        this.pexipAPI.onParticipantCreate = this.handleParticipantCreate.bind(this);

        this.pexipAPI.onParticipantUpdate = this.handleParticipantUpdate.bind(this);

        this.pexipAPI.onParticipantDelete = this.handleParticipantDelete.bind(this);

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

        this.userMediaStreamService.currentStream$.pipe(skip(1)).subscribe(currentStream => {
            this.pexipAPI.user_media_stream = currentStream;
            this.renegotiateCall();
        });

        this.setEncoder();
    }

    private setEncoder() {
        if (this.deviceTypeService.getBrowserName() === BROWSERS.FIREFOX || this.deviceTypeService.isIOS()) {
            this.enableH264(false);
        }
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

    private handleSetup(stream: MediaStream | URL) {
        this.onSetupSubject.next(new CallSetup(stream));
    }

    private handleConnect(stream: MediaStream | URL) {
        if (this.renegotiating || this.justRenegotiated) {
            this.logger.warn(
                `${this.loggerPrefix} Not initialising heartbeat or subscribing to stream modified as it was during a renegotation`
            );
            this.justRenegotiated = false;
        } else {
            this.kinlyHeartbeatService.initialiseHeartbeat(this.pexipAPI);

            if (!this.streamModifiedSubscription) {
                this.streamModifiedSubscription = this.userMediaStreamService.streamModified$
                    .pipe(takeUntil(this.hasDisconnected$))
                    .subscribe(() => this.renegotiateCall());
            }
        }

        this.onConnectedSubject.next(new ConnectedCall(stream));
    }

    private handleParticipantCreate(participantUpdate: PexipParticipant) {
        this.logger.event('PexipParticipantCreate', {
            pexipParticipantId: participantUpdate.uuid,
            event: participantUpdate,
            type: this.pexipParticipantEventType.toString()
        });

        this.onParticipantCreatedSubject.next(ParticipantUpdated.fromPexipParticipant(participantUpdate));
    }

    private handleParticipantUpdate(participantUpdate: PexipParticipant) {
        this.logger.event('PexipParticipantUpdate', {
            pexipParticipantId: participantUpdate.uuid,
            event: participantUpdate,
            type: this.pexipParticipantEventType
        });

        this.videoCallEventsService.handleParticipantUpdated(ParticipantUpdated.fromPexipParticipant(participantUpdate));
        this.onParticipantUpdatedSubject.next(ParticipantUpdated.fromPexipParticipant(participantUpdate));
    }

    private handleParticipantDelete(participantDeleted: PexipParticipantDeleted) {
        this.logger.event('PexipParticipantDelete', {
            pexipParticipantId: participantDeleted.uuid,
            event: participantDeleted,
            type: this.pexipParticipantEventType
        });

        this.onParticipantDeletedSubject.next(Guid.parse(participantDeleted.uuid));
    }

    private handleError(error: string) {
        this.kinlyHeartbeatService.stopHeartbeat();

        this.onErrorSubject.next(new CallError(error));
    }

    // Handles server issued disconections - NOT CLIENT
    // https://docs.pexip.com/api_client/api_pexrtc.htm#onDisconnect
    private handleServerDisconnect(reason: string) {
        this.logger.debug(`${this.loggerPrefix} handling server disconnection`);
        this.hasDisconnected$.next();
        this.hasDisconnected$.complete();

        this.kinlyHeartbeatService.stopHeartbeat();

        this.onDisconnected.next(new DisconnectedCall(reason));
    }

    makeCall(pexipNode: string, conferenceAlias: string, participantDisplayName: string, maxBandwidth: number) {
        this.logger.info(`${this.loggerPrefix} make pexip call`, {
            pexipNode: pexipNode
        });
        this.stopPresentation();
        this.initCallTag();
        this.pexipAPI.makeCall(pexipNode, conferenceAlias, participantDisplayName, maxBandwidth, null);
    }

    disconnectFromCall() {
        if (this.pexipAPI) {
            this.logger.info(`${this.loggerPrefix} Disconnecting from pexip node.`);
            this.stopPresentation();
            this.pexipAPI.disconnect();
            this.hasDisconnected$.next();
            this.hasDisconnected$.complete();
            this.kinlyHeartbeatService.stopHeartbeat();
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

    onParticipantCreated(): Observable<ParticipantUpdated> {
        return this.onParticipantCreatedSubject.asObservable();
    }

    onParticipantUpdated(): Observable<ParticipantUpdated> {
        return this.onParticipantUpdatedSubject.asObservable();
    }

    onParticipantDeleted(): Observable<Guid> {
        return this.onParticipantDeletedSubject.asObservable();
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

    onVideoEvidenceShared(): Observable<void> {
        return this.onVideoEvidenceSharedSubject.asObservable();
    }

    onVideoEvidenceStopped(): Observable<void> {
        return this.onVideoEvidenceStoppedSubject.asObservable();
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
        this.logger.info(`${this.loggerPrefix} Attempting lower hand by ID`, {
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

    suspendHearing(conferenceId: string): Promise<void> {
        this.logger.info(`${this.loggerPrefix} Attempting to suspend hearing`, { conference: conferenceId });
        return this.apiClient.suspendVideoHearing(conferenceId).toPromise();
    }

    leaveHearing(conferenceId: string, participantId: string): Promise<void> {
        this.logger.info(`${this.loggerPrefix} Attempting to suspend hearing`, { conference: conferenceId });
        return this.apiClient.leaveHearing(conferenceId, participantId).toPromise();
    }

    endHearing(conferenceId: string): Promise<void> {
        this.logger.info(`${this.loggerPrefix} Attempting to end hearing`, { conference: conferenceId });
        return this.apiClient.endVideoHearing(conferenceId).toPromise();
    }

    async joinHearingInSession(conferenceId: string, participantId: string) {
        this.logger.info(`${this.loggerPrefix} Attempting to call participant into hearing`, {
            conference: conferenceId,
            participant: participantId
        });
        return this.apiClient.joinHearingInSession(conferenceId, participantId).toPromise();
    }

    async callParticipantIntoHearing(conferenceId: string, participantId: string) {
        this.logger.info(`${this.loggerPrefix} Attempting to call participant into hearing`, {
            conference: conferenceId,
            participant: participantId
        });
        return this.apiClient.callParticipant(conferenceId, participantId).toPromise();
    }

    async dismissParticipantFromHearing(conferenceId: string, participantId: string) {
        this.logger.info(`${this.loggerPrefix} Attempting to dismiss participant from hearing`, {
            conference: conferenceId,
            participant: participantId
        });
        return this.apiClient.dismissParticipant(conferenceId, participantId).toPromise();
    }

    renegotiateCall(sendUpdate: boolean = false) {
        this.logger.info(`${this.loggerPrefix} renegotiating`);
        this.renegotiating = true;
        this.pexipAPI.renegotiate(sendUpdate);
        this.renegotiating = false;
        this.justRenegotiated = true;
        this.logger.info(`${this.loggerPrefix} renegotiated`);
    }

    async selectScreenWithMicrophone() {
        this.logger.info(`${this.loggerPrefix} mixing screen and microphone stream`);
        const displayStream = await this.userMediaService.selectScreenToShare();
        // capture the original screen stream to stop sharing screen when the button is clicked
        this._displayStream = displayStream;
        this.userMediaStreamService.activeMicrophoneStream$.pipe(take(1)).subscribe(micStream => {
            const mixStream = this.streamMixerService.mergeAudioStreams(displayStream, micStream);
            mixStream.addTrack(displayStream.getVideoTracks()[0]);
            // capture when the user stops screen sharing via the browser instead of the control menu
            mixStream.getVideoTracks()[0].addEventListener('ended', () => {
                this.stopScreenWithMicrophone();
            });

            this.pexipAPI.user_media_stream = mixStream;
            this.renegotiateCall();
            this.onVideoEvidenceSharedSubject.next();
        });
    }

    stopScreenWithMicrophone() {
        this.logger.info(`${this.loggerPrefix} stopping mixed screen and microphone stream`);
        this._displayStream.getTracks().forEach(t => {
            t.stop();
        });
        this.pexipAPI.user_media_stream.getTracks().forEach(t => {
            if (t.readyState === 'live') {
                t.stop();
            }
        });
        this.userMediaStreamService.currentStream$.pipe(take(1)).subscribe(currentStream => {
            this.pexipAPI.user_media_stream = currentStream;
            this.renegotiateCall();
            this.onVideoEvidenceStoppedSubject.next();
        });
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
