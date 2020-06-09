import { Url } from 'url';

export class CallSetup {
    constructor(public stream: MediaStream | Url) {}
}

export class ConnectedCall {
    constructor(public stream: MediaStream | Url) {}
}

export class DisconnectedCall {
    constructor(public reason: string) {}
}

export class CallError {
    constructor(public reason) {}
}
