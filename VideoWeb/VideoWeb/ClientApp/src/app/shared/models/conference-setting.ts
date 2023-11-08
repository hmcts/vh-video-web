export class ConferenceSetting {
    conferenceId: string;
    startWithAudioMuted: boolean;

    constructor(conferenceId: string, startWithAudioMuted: boolean) {
        this.conferenceId = conferenceId;
        this.startWithAudioMuted = startWithAudioMuted;
    }
}
