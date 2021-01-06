export class ParticipantMediaStatus {
    constructor(public is_local_muted: boolean) {}
}

export class ParticipantMediaStatusMessage {
    constructor(public conferenceId: string, public participantId: string, public mediaStatus: ParticipantMediaStatus) {}
}
