import { Component, Input } from '@angular/core';
import { ParticipantStatus } from 'src/app/services/clients/api-client';
import { Participant } from 'src/app/shared/models/participant';
import { ParticipantStatusModel } from 'src/app/shared/models/participants-status-model';

@Component({
  selector: 'app-participant-status',
  templateUrl: './participant-status.component.html',
  styleUrls: ['./participant-status.component.scss']
})
export class ParticipantStatusComponent {

  _participants: Participant[];
  _judgeStatuses: ParticipantStatus[];

  @Input() set participants(participants: ParticipantStatusModel) {
    this._participants = participants.Participants;
    this._judgeStatuses = participants.JudgeStatuses;
  }


  getParticipantStatusClass(participant: Participant): string {

    switch (participant.status) {
      case ParticipantStatus.None:
      case ParticipantStatus.NotSignedIn:
        return 'participant-not-signed-in';
      case ParticipantStatus.Disconnected:
        return 'participant-disconnected';
      case ParticipantStatus.Available:
        return 'participant-available';
      default:
        return 'participant-default-status';
    }
  }

}
