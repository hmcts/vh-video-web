export class ConferenceSetting {
    conferenceId: string;
    startWithAudioMuted: boolean;
    createdDate: Date;

    constructor(conferenceId: string, startWithAudioMuted: boolean, createdDate?: Date) {
        this.conferenceId = conferenceId;
        this.startWithAudioMuted = startWithAudioMuted;
        this.createdDate = createdDate || new Date();
    }

    // isExpired(): boolean {
    //     const today = new Date();
    //     const yesterday = new Date(today);
    //     yesterday.setDate(today.getDate() - 1);
    //     yesterday.setHours(0, 0, 0, 0);

    //     return this.createdDate <= yesterday;
    // }
}
