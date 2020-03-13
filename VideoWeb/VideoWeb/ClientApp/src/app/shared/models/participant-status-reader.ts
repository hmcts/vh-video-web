import { ParticipantStatus } from 'src/app/services/clients/api-client';

export class ParticipantStatusReader {
    getStatusAsText(status: ParticipantStatus): string {
        switch (status) {
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
                return status;
        }
    }

    getStatusAsTextForJudge(status: ParticipantStatus, statuses: ParticipantStatus[]): string {
        switch (status) {
            case ParticipantStatus.None:
            case ParticipantStatus.NotSignedIn:
                const inHearing = statuses.filter(x => x === ParticipantStatus.InHearing);
                return inHearing.length > 0 ? 'In another hearing' : 'Unavailable';
            case ParticipantStatus.InConsultation:
            case ParticipantStatus.UnableToJoin:
                return 'Unavailable';
            case ParticipantStatus.InHearing:
                return 'In Hearing';

            default:
                return status;
        }
    }
}
