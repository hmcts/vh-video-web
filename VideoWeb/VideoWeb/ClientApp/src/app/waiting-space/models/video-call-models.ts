export class CallSetup {
    constructor(public stream: MediaStream | URL) {}
}

export class ConnectedCall {
    constructor(public stream: MediaStream | URL) {}
}

export class DisconnectedCall {
    constructor(public reason: string) {}
}

export class CallError {
    constructor(public reason: string) {}
}

export class ParticipantDeleted {
    constructor(public uuid: string) {}
}

export class ParticipantUpdated {
    /** Has been administratively audio muted. */
    public isRemoteMuted: boolean;
    /** Is spotlighted. */
    public isSpotlighted: boolean;
    /** Is hand raised. */
    public handRaised: boolean;
    /** Pexip display name (string delimited values). */
    public pexipDisplayName: string;
    /** Pexip UUID of participant. */
    public uuid: string;
    /** Participant call tag. */
    public callTag: string;
    /** Is the participant an audio only call. */
    public isAudioOnlyCall: boolean;
    /** IDoes the participant have video capability. */
    public isVideoCall: boolean;
    public protocol: string;
    /** The audio mix this participant is receiving e.g. "main". */
    public receivingAudioMix: string;
    /** The audio mixes this participant is sending to. */
    public sentAudioMixes: PexipAudioMix[];
    public role: PexipParticipantRole;
    /** Has the participant muted their video */
    public isVideoMuted: boolean;

    private constructor(
        isRemoteMuted: string,
        buzzTime: number,
        pexipName: string,
        uuid: string,
        callTag: string,
        spotlightTime: number,
        isAudioOnlyCall: string,
        isVideoCall: string,
        protocol: string,
        role: PexipParticipantRole,
        receivingAudioMix?: string,
        sentAudioMixes?: PexipAudioMix[]
    ) {
        this.isRemoteMuted = isRemoteMuted?.toUpperCase() === 'YES';
        this.isSpotlighted = spotlightTime !== 0;
        this.handRaised = buzzTime !== 0;
        this.pexipDisplayName = pexipName;
        this.uuid = uuid;
        this.callTag = callTag;
        this.isAudioOnlyCall = isAudioOnlyCall?.toUpperCase() === 'YES';
        this.isVideoCall = isVideoCall?.toUpperCase() === 'YES';
        this.protocol = protocol;
        this.role = role;
        this.receivingAudioMix = receivingAudioMix;
        this.sentAudioMixes = sentAudioMixes;
    }

    static fromPexipParticipant(pexipParticipant: PexipParticipant) {
        const p = new ParticipantUpdated(
            pexipParticipant.is_muted,
            pexipParticipant.buzz_time,
            pexipParticipant.display_name,
            pexipParticipant.uuid,
            pexipParticipant.call_tag,
            pexipParticipant.spotlight,
            pexipParticipant.is_audio_only_call,
            pexipParticipant.is_video_call,
            pexipParticipant.protocol,
            pexipParticipant.role,
            pexipParticipant.receive_from_audio_mix,
            pexipParticipant.send_to_audio_mixes
        );

        p.isVideoMuted = pexipParticipant.is_video_muted;

        return p;
    }
}

export class ConferenceUpdated {
    constructor(
        public guestedMuted: boolean,
        public locked: boolean,
        public started: boolean
    ) {}

    static fromPexipConference(pexipConference: PexipConference) {
        return new ConferenceUpdated(pexipConference.guests_muted, pexipConference.locked, pexipConference.started);
    }
}

export class Presentation {
    constructor(public presentationStarted: boolean) {}
}

export class ConnectedPresentation {
    constructor(public stream: MediaStream | URL) {}
}

export class DisconnectedPresentation {
    constructor(public reason: string) {}
}

export class ConnectedScreenshare {
    constructor(public stream: MediaStream | URL) {}
}

export class StoppedScreenshare {
    constructor(public reason: string) {}
}
