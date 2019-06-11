import { ParticipantResponse, ParticipantStatus } from 'src/app/services/clients/api-client';

export class Participant {

    private participant: ParticipantResponse;

    constructor(participant: ParticipantResponse) {
        this.participant = participant;
    }

    getStatusAsText(): string {
        switch (this.participant.status) {
            case ParticipantStatus.None:
            case ParticipantStatus.NotSignedIn:
                return 'Not Signed In';
            case ParticipantStatus.InConsultation:
                return 'In Consultation';
            case ParticipantStatus.InHearing:
                return 'In Hearing';
            case ParticipantStatus.UnableToJoin:
                return 'Unable to Join';
            default:
                return this.participant.status;
        }
    }
}
