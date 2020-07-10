import { ParticipantStatus } from 'src/app/services/clients/api-client';

export class ParticipantStatusReader {
    public inAnotherHearingText = 'In another hearing';
    public unavailableText = 'Unavailable';

    getStatusAsText(status: ParticipantStatus): string {
        switch (status) {
            case ParticipantStatus.None:
            case ParticipantStatus.NotSignedIn:
                return 'Not signed in';
            case ParticipantStatus.InConsultation:
                return 'In consultation';
            case ParticipantStatus.InHearing:
                return 'In hearing';
            default:
                return status;
        }
    }

    getStatusAsTextForJudge(status: ParticipantStatus): string {
        switch (status) {
            case ParticipantStatus.None:
            case ParticipantStatus.NotSignedIn:
            case ParticipantStatus.InConsultation:
                return this.unavailableText;
            case ParticipantStatus.InHearing:
                return 'In hearing';

            default:
                return status;
        }
    }
}
