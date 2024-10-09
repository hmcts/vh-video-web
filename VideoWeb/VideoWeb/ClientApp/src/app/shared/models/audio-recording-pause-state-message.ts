export class AudioRecordingPauseStateMessage {
    constructor(
        public conferenceId: string,
        public pauseState: boolean
    ) {}
}
