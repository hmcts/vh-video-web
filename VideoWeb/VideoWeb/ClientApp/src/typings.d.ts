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

    makeCall(pexipNode: string, conferenceAlias: string, participantDisplayName: string, maxBandwidth: number, callType: string);
    connect(pin: string, extension: string);
    disconnect();
    setParticipantMute(participantId: string, mute: boolean);
    setParticipantSpotlight(participantId: string, spotlight: boolean);
    setMuteAllGuests(mute: boolean);
    muteAudio(): boolean;
    muteVideo(): boolean;
    setBuzz();
    clearBuzz(uuid?: string);
    clearAllBuzz(): () => void;
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
