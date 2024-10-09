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
    public isRemoteMuted: boolean;
    public isSpotlighted: boolean;
    public handRaised: boolean;
    public pexipDisplayName: string;
    public uuid: string;
    public callTag: string;
    public isAudioOnlyCall: boolean;
    public isVideoCall: boolean;
    public protocol: string;
    public receivingAudioMix: string;
    public sentAudioMixes: PexipAudioMix[];

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
        this.receivingAudioMix = receivingAudioMix;
        this.sentAudioMixes = sentAudioMixes;
    }

    static fromPexipParticipant(pexipParticipant: PexipParticipant) {
        return new ParticipantUpdated(
            pexipParticipant.is_muted,
            pexipParticipant.buzz_time,
            pexipParticipant.display_name,
            pexipParticipant.uuid,
            pexipParticipant.call_tag,
            pexipParticipant.spotlight,
            pexipParticipant.is_audio_only_call,
            pexipParticipant.is_video_call,
            pexipParticipant.protocol,
            pexipParticipant.receive_from_audio_mix,
            pexipParticipant.send_to_audio_mixes
        );
    }
}

export class ConferenceUpdated {
    constructor(public guestedMuted: boolean) {}
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
