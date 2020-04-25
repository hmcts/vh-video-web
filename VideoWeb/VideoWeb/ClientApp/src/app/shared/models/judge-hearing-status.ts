import {ParticipantStatus} from '../../services/clients/api-client';

export class JudgeHearingStatus {
  public conferenceId: string;
  public participantId: string;
  public username: string;
  public status: ParticipantStatus;

  constructor(conferenceId: string, participantId: string, username: string, status: ParticipantStatus) {
    this.conferenceId = conferenceId;
    this.participantId = participantId;
    this.username = username;
    this.status = status;
  }
}
