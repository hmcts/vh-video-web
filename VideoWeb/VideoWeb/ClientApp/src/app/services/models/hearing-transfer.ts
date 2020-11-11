export class HearingTransfer {
    constructor(public conferenceId: string, public participantId: string, public hearingPosition: TransferPosition) {
    }
}

export enum TransferPosition {
    In,
    Out
}