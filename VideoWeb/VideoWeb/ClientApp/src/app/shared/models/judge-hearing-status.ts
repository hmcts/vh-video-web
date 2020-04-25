import {ParticipantStatus} from '../../services/clients/api-client';

export class JudgeHearingStatus {
  public conferenceId: string;
  public username: string;
  public status: ParticipantStatus;

  constructor(conferenceId: string, username: string, status: ParticipantStatus) {
    this.conferenceId = conferenceId;
    this.username = username;
    this.status = status;
  }
}
