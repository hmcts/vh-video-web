export class ParticipantToggleLocalMuteMessage {
    constructor(
        public conferenceId: string,
        public participantId: string,
        public muted: boolean
    ) {}
}
