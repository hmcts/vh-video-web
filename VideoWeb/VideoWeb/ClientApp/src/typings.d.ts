declare interface Window {
    AudioContext: AudioContext;
    webkitAudioContext: AudioContext;
}

declare interface PexRTC {
    PexRTC(): PexipClient;
}

declare interface PexipClient {
    video_source: any;
    audio_source: any;
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

    onSetup: (stream: any, pinStatus: any, conferenceExtension: any) => void;
    onConnect: (stream: MediaStream | URL) => void;
    onError: (reason: any) => void;
    onDisconnect: (reason: any) => void;
    onParticipantUpdate: (participantUpdate: PexipParticipant) => void;
    onConferenceUpdate: (conferenceUpdate: PexipConference) => void;
    onCallTransfer: (reason: any) => void;

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

    /**
     * A presentation has started or stopped.
     * @param setting true = presentation has started; false = presentation has stopped.
     * @param presenter The name of the presenter (only given when setting = true, else null).
     * @param uuid The UUID of the presenter.
     */
    onPresentation(setting: boolean, presenter: string, uuid: string);

    makeCall(pexipNode: string, conferenceAlias: string, participantDisplayName: string, maxBandwidth: number, callType: string);
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
}

declare interface PexipConference {
    /** Whether all Guests are muted. */
    guests_muted: boolean;

    /** Whether the conference is locked. */
    locked: boolean;

    /** Whether the conference has been started. */
    started: boolean;
}

declare interface PexRTCCall {
    mutedAudio: boolean;
    mutedVideo: boolean;
    // call_type: string;
    localStream: MediaStream | URL;
    stream: MediaStream | URL;
    recv_audio: boolean;
    recv_video: boolean;
    video_source: any;
    audio_source: any;
}
