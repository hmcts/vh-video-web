export class ChatHubMessage {
    conferenceId: string;
    from: string;
    message: string;
    timestamp: Date;

    constructor($conferenceId: string, $from: string, $message: string, $timestamp: Date) {
        this.conferenceId = $conferenceId;
        this.from = $from;
        this.message = $message;
        this.timestamp = $timestamp;
    }
}
