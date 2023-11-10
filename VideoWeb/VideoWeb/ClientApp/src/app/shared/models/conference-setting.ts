export class ConferenceSetting {
    conferenceId: string;
    startWithAudioMuted: boolean;
    createdDate: Date;

    constructor(conferenceId: string, startWithAudioMuted: boolean, createdDate?: Date) {
        this.conferenceId = conferenceId;
        this.startWithAudioMuted = startWithAudioMuted;
        this.createdDate = createdDate || new Date();
    }
}
