import { ParticipantMediaStatus } from './participant-media-status';

export class ParticipantMediaStatusMessage {
    constructor(public conferenceId: string, public participantId: string, public mediaStatus: ParticipantMediaStatus) {}
}
