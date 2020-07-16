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
    public isMuted: boolean;
    public handRaised: boolean;
    public pexipDisplayName: string;

    constructor(isMuted: string, buzzTime: number, pexipName: string) {
        this.isMuted = isMuted === 'YES';
        this.handRaised = buzzTime !== 0;
        this.pexipDisplayName = pexipName;
    }
}

export class ConferenceUpdated {
    constructor(public guestedMuted: boolean) {}
}
