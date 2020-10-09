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
    constructor(public reason) {}
}

export class ParticipantUpdated {
    public isRemoteMuted: boolean;
    public isSpotlighted: boolean;
    public handRaised: boolean;
    public pexipDisplayName: string;
    public uuid: string;

    constructor(isMuted: string, buzzTime: number, pexipName: string, uuid: string, spotlightTime: number) {
        this.isRemoteMuted = isMuted.toUpperCase() === 'YES';
        this.isSpotlighted = spotlightTime !== 0;
        this.handRaised = buzzTime !== 0;
        this.pexipDisplayName = pexipName;
        this.uuid = uuid;
    }
}

export class ConferenceUpdated {
    constructor(public guestedMuted: boolean) {}
}
