export class HearingTransfer {
    constructor(public conferenceId: string, public participantId: string, public transferDirection: TransferDirection) {}
}

export enum TransferDirection {
    In = 'In',
    Out = 'Out'
}
