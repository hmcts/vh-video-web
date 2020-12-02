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
    public isVideoCall: boolean;

    static fromPexipParticipant(pexipParticipant: PexipParticipant) {
        return new ParticipantUpdated(
            pexipParticipant.is_muted,
            pexipParticipant.buzz_time,
            pexipParticipant.display_name,
            pexipParticipant.uuid,
            pexipParticipant.spotlight,
            pexipParticipant.is_audio_only_call,
            pexipParticipant.is_video_call
        );
    }
    private constructor(
        isMuted: string,
        buzzTime: number,
        pexipName: string,
        uuid: string,
        spotlightTime: number,
        isAudioOnlyCall: string,
        isVideoCall: string
    ) {
        this.isRemoteMuted = isMuted.toUpperCase() === 'YES';
        this.isSpotlighted = spotlightTime !== 0;
        this.handRaised = buzzTime !== 0;
        this.pexipDisplayName = pexipName;
        this.uuid = uuid;
        this.isAudioOnlyCall = isAudioOnlyCall.toUpperCase() === 'YES';
        this.isVideoCall = isVideoCall.toUpperCase() === 'YES';
    }
}

export class ConferenceUpdated {
    constructor(public guestedMuted: boolean) {}
}
