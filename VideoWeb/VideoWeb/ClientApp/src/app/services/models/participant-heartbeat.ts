export class ParticipantHeartbeat {
    constructor(
        public conferenceId: string,
        public participantId: string,
        public heartbeatHealth: HeartbeatHealth,
        public browserName: string,
        public browserVersion: string,
        public osName: string,
        public osVersion: string
    ) {}
}

export enum HeartbeatHealth {
    None = 'None',
    Good = 'Good',
    Poor = 'Poor',
    Bad = 'Bad'
}
