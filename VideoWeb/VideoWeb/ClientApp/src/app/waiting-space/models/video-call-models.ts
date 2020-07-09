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

    constructor(isMuted: string, buzzTime: number) {
        this.isMuted = isMuted === 'YES';
        this.handRaised = buzzTime !== 0;
    }
}

export class ConferenceUpdated {
    constructor(public guestedMuted: boolean) {}
}
