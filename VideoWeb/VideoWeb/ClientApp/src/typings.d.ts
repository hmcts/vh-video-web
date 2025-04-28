declare interface Window {
    AudioContext: AudioContext;
    webkitAudioContext: AudioContext;
}

interface HTMLCanvasElement {
    captureStream(frameRate?: number): MediaStream;
}

interface Console {
    defaultWarn;
}

declare type HeartbeatFactory = new (
    pexipApi: PexipClient,
    url: string,
    conferenceId: string,
    participantId: string,
    token: string,
    handleHeartbeat: () => void
) => HeartbeatClient;

declare class HeartbeatClient {
    logHeartbeat: boolean;
    constructor(
        pexipApi: PexipClient,
        url: string,
        conferenceId: string,
        participantId: string,
        /**
         * The JWT token to use for authentication.
         * Must be `Bearer ${token}`.
         */
        token: string,
        callback: (data: any) => void
    );
    kill(): void;
}

declare interface PexRTC {
    PexRTC(): PexipClient;
}

declare type PexipCallType = 'presentation' | 'screen' | 'audioonly' | 'recvonly' | 'rtmp' | 'stream' | 'none' | 'test_call';

declare type PexipDialOutCallType = 'video' | 'video-only ' | 'audio';

declare type PexipProtocol = 'sip' | 'h323' | 'rtmp' | 'mssip' | 'auto';

declare type PexipRole = 'GUEST' | 'HOST';

declare type PexipParticipantRole = 'GUEST' | 'chair';

declare interface PexipDialOutResponse {
    /**
     * "success" or "error"
     */
    status: string;
    /**
     * List of added participant ids
     */
    result: string[];
}

declare interface PexipDialOutParams {
    /**
     * This additional parameter can be specified for RTMP calls to send the presentation stream to a separate RTMP destination.
     */
    presentation_uri?: string;

    /**
     * Identifies the dialed participant as a streaming or recording device:
     * true: streaming/recording participant
     * false: not a streaming/recording participant
     * Default: false
     */
    streaming?: boolean;

    /**
     * An optional DTMF sequence to transmit after the call to the dialed participant starts.
     */
    dtmf_sequence?: string;

    /**
     * Limits the media content of the call:<br>
     * "video": main video plus presentation<br>
     * "video-only": main video only<br>
     * "audio": audio-only<br>
     * Default: "video"
     */
    call_type?: PexipDialOutCallType;

    /**
     * An optional friendly name for this participant. This may be used instead of the participant's alias in participant lists and as a text overlay in some layout configurations.
     */
    remote_display_name?: string;

    /**
     * Optional text to use instead of remote_display_name as the participant name overlay text.
     */
    overlay_text?: string;
}

declare interface PexipClient {
    video_source: string | boolean;
    audio_source: string | boolean;
    h264_enabled: boolean;
    mutedAudio: boolean;
    mutedVideo: boolean;
    is_screenshare: boolean;
    user_media_stream: MediaStream;
    user_presentation_stream: MediaStream;
    screenshare_fps: number;
    call_type: string;
    call_uuid: string;
    call_tag: string;
    call: PexRTCCall;
    protocol: string;
    turn_server: TurnServer;
    role: PexipRole;
    state: string;

    /**
     * The WebRTC incoming full-frame rate presentation stream has been set up successfully.
     */
    onPresentationConnected: (stream: MediaStream | URL) => void;

    /**
     * The WebRTC incoming presentation stream has been stopped. Note that this does not occur when someone else starts presenting; rather, it occurs on errors and call disconnect.
     */
    onPresentationDisconnected: (reason: string) => void;

    /**
     * The outgoing screenshare has been set up correctly.
     */
    onScreenshareConnected: (stream: MediaStream | URL) => void;

    /**
     * The WebRTC screensharing presentation stream has been stopped. The floor may have been taken by another presenter, or the user stopped the screenshare, or some other error occurred.
     */
    onScreenshareStopped: (reason: string) => void;

    onLog: (message: string, ...args: any[]) => void;
    onSetup: (stream: any, pinStatus: any, conferenceExtension: any) => void;
    onConnect: (stream: MediaStream | URL) => void;
    onError: (reason: string) => void;
    onDisconnect: (reason: string) => void;
    onParticipantCreate: (participantUpdate: PexipParticipant) => void;
    onParticipantUpdate: (participantUpdate: PexipParticipant) => void;
    onParticipantDelete: (participantDeleted: PexipParticipantDeleted) => void;
    onConferenceUpdate: (conferenceUpdate: PexipConference) => void;
    onCallTransfer: (alias: string) => void;
    renegotiate: (sendUpdate: boolean) => void;

    /**
     * A presentation has started or stopped.
     * @param setting true = presentation has started; false = presentation has stopped.
     * @param presenter The name of the presenter (only given when setting = true, else null).
     * @param uuid The UUID of the presenter.
     */
    onPresentation(setting: boolean, presenter: string, uuid: string);

    makeCall(pexipNode: string, conferenceAlias: string, participantDisplayName: string, maxBandwidth: number, callType?: PexipCallType);
    connect(pin: string, extension: string);

    /**
     * Escalate existing call to add video/presentation/screensharing. Typically used when currently in a call_type of "none" (roster-only view).
     * @param call_type Optional (default is to bring up a WebRTC video call)
     */
    addCall(call_type);

    /**
     * Disconnect participant.
     */
    disconnect();
    /**
     * Disconnect the A/V call in use, leaving the control-only participant connected.
     */
    disconnectCall();
    setParticipantMute(participantId: string, mute: boolean);
    setParticipantSpotlight(participantId: string, spotlight: boolean);
    setMuteAllGuests(mute: boolean);
    muteAudio(): boolean;
    muteVideo(): boolean;
    setBuzz();
    clearBuzz(uuid?: string);
    clearAllBuzz(): () => void;
    getMediaStatistics(): any;
    setParticipantText(uuid: string, text: string);
    setSendToAudioMixes(mixes: PexipAudioMix[], uuid: string);
    setReceiveFromAudioMix(mixName: string, uuid: string);

    /**
     * Activate or stop screen capture sharing.
     * Currently only "screen" is supported, or null to stop screen sharing.
     */
    present(callType: string);

    /**
     * Stops a full-frame rate presentation stream if it is running.
     */
    stopPresentation();

    /**
     * Request the full-frame rate presentation stream to be activated.
     * Although this method can be used at any time, it only makes sense to do this after onPresentation callback has said that a presentation is available.
     */
    getPresentation();

    // Disconnect a given participant. Only available to users with "chair" (Host) rights.
    disconnectParticipant(uuid: string);

    // Dial out from the conference. And stream to external URL. Only available to users with "chair" (Host) rights.
    dialOut(destination: string, protocol: PexipProtocol, role: PexipRole, cb: Function, user_params: PexipDialOutParams);

    transformLayout(transforms: any);
}

declare interface TurnServer {
    urls: string[] | string;
    username: string;
    credential: string;
}

declare interface PexipParticipantDeleted {
    /** The UUID of this participant, to use with other operations. */
    uuid: string;
}

declare interface PexipParticipant {
    /** A Unix timestamp of when this participant raised their hand, otherwise zero. */
    buzz_time: number;

    /** Set to "YES" if the participant is administratively muted. */
    is_muted: string;

    /** The display name of the participant. */
    display_name: string;

    /** The calling or "from" alias. This is the alias that the recipient would use to return the call. */
    local_alias: string;

    /** A Unix timestamp of when this participant joined (UTC). */
    start_time: number;

    /** The UUID of this participant, to use with other operations. */
    uuid: string;

    /** A Unix timestamp of when this participant was spotlighted, if spotlight is used. */
    spotlight: number;

    /** Set to "YES" if the participant can be muted, "NO" if not. */
    mute_supported: string;

    /** Boolean indicating if it is an external participant, e.g. coming in from a Skype for Business / Lync meeting. */
    is_external: boolean;

    /**
     * The UUID of an external node e.g. a Skype for Business / Lync meeting associated with an external participant.
     * This allows grouping of external participants as the UUID will be the same for all participants associated with that external node.
     */
    external_node_uuid: string;

    /** Boolean indicating whether the user has media capabilities. */
    has_media: boolean;

    /** An optional call tag that is assigned to this participant. */
    call_tag: string;

    /** Set to "YES" if the call is audio only. */
    is_audio_only_call: string;

    /** Set to "YES" if the call has video capability. */
    is_video_call: string;

    /** Boolean indicating whether this participant has muted their video. */
    is_video_muted: boolean;

    /** Boolean indicating if the user has moved away (silent video detection in an Adaptive Composition layout). */
    is_video_silent: boolean;

    /** The call protocol. Values: "api", "webrtc", "sip", "rtmp", "h323" or "mssip" */
    protocol: string;

    /** Set to "YES" if this participant can be transferred into another VMR; "NO" if not. */
    transfer_supported: string;

    /** Set to "YES" if the participant can be disconnected, "NO" if not. */
    disconnect_supported: string;

    /** Boolean indicating if video from the user has been lost. */
    is_main_video_dropped_out: boolean;

    /** Boolean indicating whether this is a streaming/recording participant. */
    is_streaming_conference: boolean;

    /** list of mixes to be sent participant audio */
    send_to_audio_mixes: PexipAudioMix[];

    /** the name of the audio a participant is receiving a mix */
    receive_from_audio_mix: string;

    /** The level of privileges the participant has in the conference:
     * "chair": the participant has Host privileges
     * "guest": the participant has Guest privileges
     *
     */
    role: PexipParticipantRole;
}

declare interface PexipConference {
    /** Whether all Guests are muted. */
    guests_muted: boolean;

    /** Whether the conference is locked. */
    locked: boolean;

    /** Whether the conference has been started. */
    started: boolean;

    /** Specifies if the conference is using direct media. */
    direct_media: boolean;
}

declare interface PexRTCCall {
    mutedAudio: boolean;
    mutedVideo: boolean;
    // call_type: string;
    localStream: MediaStream | URL;
    stream: MediaStream | URL;
    recv_audio: boolean;
    recv_video: boolean;
    video_source: string;
    audio_source: string;
}

declare interface PexipAudioMix {
    /** The name of of the mix. Will be the participant language in VH */
    mix_name: string;
    /** Should the audio be prominent. If false the volume will be lowered when other participants receive the audio */
    prominent: boolean;
}
