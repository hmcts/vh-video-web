import {ParticipantStatus} from 'src/app/services/clients/api-client';

export class ParticipantStatusReader {
  public inAnotherHearingText = 'In another hearing';
  public unavailableText = 'Unavailable';

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

  getStatusAsTextForJudge(status: ParticipantStatus): string {
    switch (status) {
      case ParticipantStatus.None:
      case ParticipantStatus.NotSignedIn:
        return this.unavailableText;
      case ParticipantStatus.InConsultation:
      case ParticipantStatus.UnableToJoin:
        return this.unavailableText;
      case ParticipantStatus.InHearing:
        return 'In Hearing';

      default:
        return status;
    }
  }
}
