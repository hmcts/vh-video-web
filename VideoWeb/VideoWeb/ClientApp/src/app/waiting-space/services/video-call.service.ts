import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';
import { Observable, Subject, Subscription } from 'rxjs';
import { concatMap, skip, take, takeUntil } from 'rxjs/operators';
import { ConfigService } from 'src/app/services/api/config.service';
import { ClientSettingsResponse, HearingLayout, Supplier } from 'src/app/services/clients/api-client';
import { HeartbeatService } from 'src/app/services/conference/heartbeat.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { SessionStorage } from 'src/app/services/session-storage';
import { StreamMixerService } from 'src/app/services/stream-mixer.service';
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
    ParticipantDeleted,
    ParticipantUpdated,
    Presentation,
    StoppedScreenshare
} from '../models/video-call-models';

import { Store } from '@ngrx/store';
import { ConferenceActions } from '../store/actions/conference.actions';
import { ConferenceState } from '../store/reducers/conference.reducer';
import {
    mapPexipConferenceToVhPexipConference,
    mapPexipParticipantToVHPexipParticipant
} from '../store/models/api-contract-to-state-model-mappers';
import { UserMediaStreamServiceV2 } from 'src/app/services/user-media-stream-v2.service';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { VideoCallActions } from '../store/actions/video-call.action';

@Injectable()
export class VideoCallService {
    readonly VIDEO_CALL_PREFERENCE_KEY = 'vh.videocall.preferences';
    readonly PREFERRED_LAYOUT_KEY = 'vh.preferred.layout';

    pexipAPI: PexipClient;
    streamModifiedSubscription: Subscription;
    wowzaAgentName = 'vh-wowza';
    deviceAvailability: { hasACamera: boolean; hasAMicrophone: boolean };

    private readonly loggerPrefix = '[VideoCallService] -';
    private readonly preferredLayoutCache: SessionStorage<Record<string, HearingLayout>>;

    private onSetupSubject = new Subject<CallSetup>();
    private onConnectedSubject = new Subject<ConnectedCall>();
    private onDisconnected = new Subject<DisconnectedCall>();
    private onErrorSubject = new Subject<CallError>();
    private onCallTransferSubject = new Subject<any>();
    private onParticipantUpdatedSubject = new Subject<ParticipantUpdated>();
    private onConferenceUpdatedSubject = new Subject<ConferenceUpdated>();
    private onParticipantCreatedSubject = new Subject<ParticipantUpdated>();
    private onParticipantDeletedSubject = new Subject<ParticipantDeleted>();

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

    private _displayStream: MediaStream;
    private supplier: Supplier;
    private uniqueCallTagsPerCall: boolean;

    private renegotiateSubject = new Subject<boolean>();

    constructor(
        private logger: Logger,
        private userMediaService: UserMediaService,
        private userMediaStreamService: UserMediaStreamServiceV2,
        private configService: ConfigService,
        private heartbeatService: HeartbeatService,
        private streamMixerService: StreamMixerService,
        private store: Store<ConferenceState>,
        private ldService: LaunchDarklyService
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
    async setupClient(supplier: Supplier): Promise<void> {
        this.logger.debug(`${this.loggerPrefix} setting up client.`);
        this.hasDisconnected$ = new Subject();
        this.supplier = supplier ?? Supplier.Vodafone;

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
        this.userMediaStreamService.createAndPublishStream();
        this.logger.debug(`${this.loggerPrefix} attempting to setup user media stream`);
        this.pexipAPI.user_media_stream = await this.userMediaStreamService.currentStream$.pipe(take(1)).toPromise();

        this.pexipAPI.onSetup = this.handleSetup.bind(this);

        this.pexipAPI.onConnect = this.handleConnect.bind(this);

        this.pexipAPI.onError = this.handleError.bind(this);

        // Handles server issued disconections - NOT CLIENT
        // https://docs.pexip.com/api_client/api_pexrtc.htm#disconnect
        this.pexipAPI.onDisconnect = this.handleServerDisconnect.bind(this);

        this.pexipAPI.onParticipantUpdate = this.handleParticipantUpdate.bind(this);
        this.pexipAPI.onParticipantCreate = this.handleParticipantCreated.bind(this);
        this.pexipAPI.onParticipantDelete = this.handleParticipantDeleted.bind(this);

        this.pexipAPI.onConferenceUpdate = function (conferenceUpdate: PexipConference) {
            const conference = ConferenceUpdated.fromPexipConference(conferenceUpdate);
            self.onConferenceUpdatedSubject.next(conference);

            if (self.pexipAPI.call_type === 'test_call') {
                return;
            }

            self.store.dispatch(
                ConferenceActions.upsertPexipConference({ pexipConference: mapPexipConferenceToVhPexipConference(conference) })
            );
        };

        this.pexipAPI.onCallTransfer = function (alias) {
            self.onCallTransferSubject.next(alias);
        };

        this.pexipAPI.onPresentation = function (setting, _presenter, _uuid) {
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

        this.userMediaService.isAudioOnly$
            .pipe(takeUntil(this.hasDisconnected$))
            .subscribe(isAudioOnly => this.handleAudioOnlyChange(isAudioOnly));

        this.userMediaStreamService.currentStream$.pipe(skip(1), takeUntil(this.hasDisconnected$)).subscribe(currentStream => {
            this.pexipAPI.user_media_stream = currentStream;
            this.logMediaStreamInfo();

            if (currentStream) {
                self.logger.debug(`${self.loggerPrefix} Renegotiate due to user media stream change`);
                this.renegotiateCall();
            }
        });

        this.renegotiateSubject
            .pipe(
                takeUntil(this.hasDisconnected$),
                concatMap(sendUpdate => this.performRenegotiation(sendUpdate)) // Process one renegotiation at a time,
            )
            .subscribe({
                next: () => this.logger.debug(`${this.loggerPrefix} Renegotiation completed`),
                error: err => this.logger.error(`${this.loggerPrefix} Renegotiation failed`, err)
            });

        this.ldService
            .getFlag<boolean>(FEATURE_FLAGS.uniqueCallTags, true)
            .pipe(takeUntil(this.hasDisconnected$))
            .subscribe(uniqueCallTags => {
                this.uniqueCallTagsPerCall = uniqueCallTags;
            });
    }

    handleAudioOnlyChange(isAudioOnly: boolean) {
        this.logger.debug(`${this.loggerPrefix} Audio only setting changed`, { isAudioOnly });
        if (!!this.pexipAPI?.call && this.pexipAPI?.call?.mutedVideo !== isAudioOnly) {
            this.store.dispatch(VideoCallActions.toggleOutgoingVideo());
        }
    }

    initTurnServer() {
        const config = this.configService.getConfig();
        const supplierConfig = this.getSupplierConfig(config);
        const turnServerObj = {
            urls: `turn:${supplierConfig.turn_server}`,
            username: supplierConfig.turn_server_user,
            credential: supplierConfig.turn_server_credential
        };
        this.pexipAPI.turn_server = turnServerObj;
    }

    initCallTag() {
        this.pexipAPI.call_tag = Guid.create().toString();
        this.logger.debug(`${this.loggerPrefix} call tag set to ${this.pexipAPI.call_tag}`);
    }

    async makeCall(pexipNode: string, conferenceAlias: string, participantDisplayName: string, maxBandwidth: number, conferenceId: string) {
        if (this.pexipAPI?.call) {
            this.logger.warn(`${this.loggerPrefix} A call is already active. Disconnecting the current call before making a new one.`);
            this.disconnectFromCall();
        }

        if (this.uniqueCallTagsPerCall) {
            this.logger.debug(
                `${this.loggerPrefix} unique call tags per call is enabled, generating new call tag (ignore the one from setup)`
            );
            this.initCallTag();
        }
        this.deviceAvailability = await this.userMediaService.checkCameraAndMicrophonePresence();
        const hasCameraDevices = this.deviceAvailability.hasACamera;
        const hasMicrophoneDevices = this.deviceAvailability.hasAMicrophone;
        const callType: PexipCallType = conferenceAlias.includes('testcall2') ? 'test_call' : null;
        this.logger.debug(`${this.loggerPrefix} making call`, {
            callType,
            conferenceAlias
        });
        if (hasCameraDevices && hasMicrophoneDevices) {
            this.makePexipCall(pexipNode, conferenceAlias, participantDisplayName, maxBandwidth, callType);
        } else if (!hasCameraDevices && hasMicrophoneDevices) {
            this.pexipAPI.video_source = false;
            this.makePexipCall(pexipNode, conferenceAlias, participantDisplayName, maxBandwidth, callType);
        } else {
            this.pexipAPI.video_source = false;
            this.pexipAPI.audio_source = false;
            this.makePexipCall(pexipNode, conferenceAlias, participantDisplayName, maxBandwidth, 'recvonly');
        }

        if (conferenceId && !hasMicrophoneDevices) {
            this.userMediaService.updateStartWithAudioMuted(conferenceId, true);
        }
    }

    disconnectFromCall() {
        if (this.pexipAPI) {
            this.logger.debug(`${this.loggerPrefix} Disconnecting from Pexip node.`);
            this.stopPresentation();
            this.pexipAPI.disconnect();
            this.cleanUpConnection();
            this.userMediaStreamService.closeCurrentStream();
        } else {
            this.logger.warn(`${this.loggerPrefix} No active Pexip client to disconnect.`);
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

    onParticipantDeleted(): Observable<ParticipantDeleted> {
        return this.onParticipantDeletedSubject.asObservable();
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

    renegotiateCall(sendUpdate: boolean = false) {
        if (this.renegotiating) {
            this.logger.debug(`${this.loggerPrefix} Not renegotiating as a renegotiation is already in progress`);
            return;
        }

        if (this.pexipAPI.state.toLowerCase() !== 'connected') {
            debugger;
            this.logger.info(`${this.loggerPrefix} Not renegotiating as the call is not active`);
            return;
        }
        this.logger.info(`${this.loggerPrefix} Queuing renegotiation request`);
        // Queue renegotiation requests to ensure they are processed one at a time and not lost
        this.renegotiateSubject.next(sendUpdate);
    }

    async selectScreenWithMicrophone() {
        this.logger.debug(`${this.loggerPrefix} mixing screen and microphone stream`);
        const displayStream = await this.userMediaService.selectScreenToShare();
        // capture the original screen stream to stop sharing screen when the button is clicked
        this._displayStream = displayStream;
        this.userMediaStreamService.currentStream$.pipe(take(1)).subscribe(currentStream => {
            const mixStream = this.streamMixerService.mergeAudioStreams(displayStream, currentStream);
            mixStream.addTrack(displayStream.getVideoTracks()[0]);
            // capture when the user stops screen sharing via the browser instead of the control menu
            mixStream.getVideoTracks()[0].addEventListener('ended', () => {
                this.stopScreenWithMicrophone();
            });

            this.pexipAPI.user_media_stream = mixStream;
            this.logger.debug(`${this.loggerPrefix} Renegotiate due to selecting screen with microphone`);
            this.renegotiateCall();
            this.onVideoEvidenceSharedSubject.next();
        });
    }

    stopScreenWithMicrophone() {
        this.logger.debug(`${this.loggerPrefix} stopping mixed screen and microphone stream`);
        this._displayStream.getTracks().forEach(t => {
            t.stop();
        });
        this.pexipAPI.user_media_stream.getTracks().forEach(t => {
            if (t.readyState === 'live') {
                t.stop();
            }
        });
        this.userMediaStreamService.createAndPublishStream();
        this.userMediaStreamService.currentStream$.pipe(take(1)).subscribe(currentStream => {
            this.pexipAPI.user_media_stream = currentStream;

            this.logMediaStreamInfo();
            this.logger.debug(`${this.loggerPrefix} Renegotiate due to stopping screen with microphone`);
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
        this.pexipAPI.present(null);
    }

    connectWowzaAgent(ingestUrl: string, callbackFn: Function) {
        const params: PexipDialOutParams = {
            streaming: true,
            call_type: 'audio',
            remote_display_name: this.wowzaAgentName
        };
        this.pexipAPI.dialOut(ingestUrl, 'auto', 'GUEST', callbackFn, params);
    }

    callParticipantByTelephone(telephone: string, callbackFn: Function) {
        const dialOutTelephone = `611${telephone}`;
        const name = telephone.slice(-4);
        const params: PexipDialOutParams = {
            call_type: 'audio',
            remote_display_name: name,
            overlay_text: name
        };
        this.pexipAPI.dialOut(dialOutTelephone, 'auto', 'GUEST', callbackFn, params);
    }

    /**
     * Disconnects the audio recording agent for wowza.
     * @param wowzaUUID string - pexip id of the wowza participant **/
    disconnectWowzaAgent(wowzaUUID: string) {
        this.pexipAPI.disconnectParticipant(wowzaUUID);
    }

    setParticipantOverlayText(uuid: string, text: string) {
        this.pexipAPI.setParticipantText(uuid, text);
    }

    transformLayout(layout: string) {
        return this.pexipAPI.transformLayout({ layout: layout });
    }

    sendParticipantAudioToMixes(mixes: PexipAudioMix[], uuid: string) {
        this.pexipAPI.setSendToAudioMixes(mixes, uuid);
    }

    receiveAudioFromMix(mixName: string, uuid: string) {
        this.pexipAPI.setReceiveFromAudioMix(mixName, uuid);
    }

    logMediaStreamInfo() {
        this.logger.debug(`${this.loggerPrefix} set user media stream`, this.pexipAPI?.user_media_stream ? 'stream set' : 'stream not set');
    }

    private makePexipCall(
        pexipNode: string,
        conferenceAlias: string,
        participantDisplayName: string,
        maxBandwidth: number,
        callType?: PexipCallType
    ) {
        this.logger.debug(`${this.loggerPrefix} make pexip call`, {
            pexipNode: pexipNode,
            conferenceAlias,
            participantDisplayName,
            callType
        });
        this.pexipAPI.makeCall(pexipNode, conferenceAlias, participantDisplayName, maxBandwidth, callType);
    }

    private handleSetup(stream: MediaStream | URL) {
        this.onSetupSubject.next(new CallSetup(stream));
    }

    private handleConnect(stream: MediaStream | URL) {
        this.logger.debug(`${this.loggerPrefix} handling connect`, {
            call_type: this.pexipAPI.call_type
        });
        if (this.renegotiating || this.justRenegotiated) {
            this.logger.debug(
                `${this.loggerPrefix} Not initialising heartbeat or subscribing to stream modified as it was during a renegotation`
            );
            this.justRenegotiated = false;
        } else {
            if (this.pexipAPI.call_type === 'test_call') {
                this.onConnectedSubject.next(new ConnectedCall(stream));
                return;
            }
            this.heartbeatService.initialiseHeartbeat(this.pexipAPI);
        }

        this.onConnectedSubject.next(new ConnectedCall(stream));
    }

    private handleParticipantCreated(participantUpdate: PexipParticipant) {
        this.logger.debug(`${this.loggerPrefix} handling participant created`, participantUpdate);
        const participant = ParticipantUpdated.fromPexipParticipant(participantUpdate);
        if (!participant.pexipDisplayName) {
            return;
        }

        this.onParticipantCreatedSubject.next(participant);

        if (this.pexipAPI.call_type === 'test_call') {
            return;
        }

        this.store.dispatch(
            ConferenceActions.createPexipParticipant({ participant: mapPexipParticipantToVHPexipParticipant(participant) })
        );
    }

    private handleParticipantDeleted(participantDeleted: PexipParticipantDeleted) {
        this.logger.debug(`${this.loggerPrefix} handling participant Delete`);
        this.store.dispatch(ConferenceActions.deletePexipParticipant({ pexipUUID: participantDeleted.uuid }));
        this.onParticipantDeletedSubject.next(new ParticipantDeleted(participantDeleted.uuid));
    }

    private handleParticipantUpdate(participantUpdate: PexipParticipant) {
        this.logger.debug(`${this.loggerPrefix} handling participant updated`, participantUpdate);
        const participant = ParticipantUpdated.fromPexipParticipant(participantUpdate);
        if (!participant.pexipDisplayName) {
            return;
        }

        this.onParticipantUpdatedSubject.next(participant);

        if (this.pexipAPI.call_type === 'test_call') {
            return;
        }

        this.store.dispatch(
            ConferenceActions.upsertPexipParticipant({ participant: mapPexipParticipantToVHPexipParticipant(participant) })
        );
    }

    private handleError(error: string) {
        this.cleanUpConnection();
        this.logger.error(`${this.loggerPrefix} Pexip error`, new Error(error));
        this.onErrorSubject.next(new CallError(error));
    }

    // Handles server issued disconections - NOT CLIENT
    // https://docs.pexip.com/api_client/api_pexrtc.htm#onDisconnect
    private handleServerDisconnect(reason: string) {
        this.logger.debug(`${this.loggerPrefix} handling server disconnection`, { reason });

        this.cleanUpConnection();
        this.onDisconnected.next(new DisconnectedCall(reason));
    }

    private cleanUpConnection() {
        this.logger.info(`${this.loggerPrefix} Cleaning up connection.`);
        this.hasDisconnected$.next();
        this.hasDisconnected$.complete();
        this.heartbeatService.stopHeartbeat();
        this.logger.info(`${this.loggerPrefix} Re-creating a new instance of Pexip API client in preparation for next call.`);
        this.setupClient(this.supplier);
    }

    private getSupplierConfig(config: ClientSettingsResponse) {
        return config.supplier_configurations.find(x => x.supplier === this.supplier);
    }

    private performRenegotiation(sendUpdate: boolean): Observable<void> {
        return new Observable<void>(observer => {
            this.logger.debug(`${this.loggerPrefix} renegotiating`);
            this.renegotiating = true;
            this.pexipAPI.renegotiate(sendUpdate);
            this.renegotiating = false;
            this.justRenegotiated = true;
            this.logger.debug(`${this.loggerPrefix} renegotiated`);
            observer.next();
            observer.complete();
        });
    }
}
