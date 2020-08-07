declare interface Window {
    AudioContext: AudioContext;
    webkitAudioContext: AudioContext;
}

declare interface PexRTC {
    PexRTC(): PexipClient;
}

declare interface PexipClient {
    video_source: string;
    audio_source: string;
    h264_enabled: boolean;

    onSetup: (stream: any, pinStatus: any, conferenceExtension: any) => void;
    onConnect: (stream: MediaStream | URL) => void;
    onError: (reason: any) => void;
    onDisconnect: (reason: any) => void;
    onParticipantUpdate: (participantUpdate: PexipParticipant) => void;
    onConferenceUpdate: (conferenceUpdate: PexipConference) => void;

    makeCall(pexipNode: string, conferenceAlias: string, participantDisplayName: string, maxBandwidth: number);
    connect(pin: string, extension: string);
    disconnect();
    setParticipantMute(participantId: string, mute: boolean);
    setMuteAllGuests(mute: boolean);
    muteAudio(): boolean;
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
    mute_supported;

    /** Boolean indicating if it is an external participant, e.g. coming in from a Skype for Business / Lync meeting. */
    is_external: boolean;

    /**
     * The UUID of an external node e.g. a Skype for Business / Lync meeting associated with an external participant.
     * This allows grouping of external participants as the UUID will be the same for all participants associated with that external node.
     */
    external_node_uuid: string;

    /** Boolean indicating whether the user has media capabilities. */
    has_media: boolean;
}

declare interface PexipConference {
    /** Whether all Guests are muted. */
    guests_muted: boolean;

    /** Whether the conference is locked. */
    locked: boolean;

    /** Whether the conference has been started. */
    started: boolean;
}
