export class ParticipantRemoteMuteMessage {
    constructor(public conferenceId: string, public participantId: string, public isRemoteMuted: boolean) {}
}
