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

export class ParticipantUpdated {
    public isRemoteMuted: boolean;
    public isSpotlighted: boolean;
    public handRaised: boolean;
    public pexipDisplayName: string;
    public uuid: string;
    public isAudioOnlyCall: boolean;
    m;
    public isVideoCall: boolean;
    public protocol: string;

    static fromPexipParticipant(pexipParticipant: PexipParticipant) {
        return new ParticipantUpdated(
            pexipParticipant.is_muted,
            pexipParticipant.buzz_time,
            pexipParticipant.display_name,
            pexipParticipant.uuid,
            pexipParticipant.spotlight,
            pexipParticipant.is_audio_only_call,
            pexipParticipant.is_video_call,
            pexipParticipant.protocol
        );
    }
    private constructor(
        isRemoteMuted: string,
        buzzTime: number,
        pexipName: string,
        uuid: string,
        spotlightTime: number,
        isAudioOnlyCall: string,
        isVideoCall: string,
        protocol: string
    ) {
        this.isRemoteMuted = isRemoteMuted.toUpperCase() === 'YES';
        this.isSpotlighted = spotlightTime !== 0;
        this.handRaised = buzzTime !== 0;
        this.pexipDisplayName = pexipName;
        this.uuid = uuid;
        this.isAudioOnlyCall = isAudioOnlyCall.toUpperCase() === 'YES';
        this.isVideoCall = isVideoCall.toUpperCase() === 'YES';
        this.protocol = protocol;
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
