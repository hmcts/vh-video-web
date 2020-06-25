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
    constructor(public uuid: string, displayName: string, isMuted: boolean, uri: string) {}
}
