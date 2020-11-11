export class HearingTransfer {
    constructor(public conferenceId: string, public participantId: string, public transferDirection: TransferPosition) {
    }
}

export enum TransferPosition {
    In,
    Out
}