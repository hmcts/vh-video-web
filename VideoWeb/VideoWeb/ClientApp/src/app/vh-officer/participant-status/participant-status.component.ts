import { Component, Input, OnInit } from '@angular/core';
import { ParticipantResponse, ParticipantStatus, UserRole } from 'src/app/services/clients/api-client';
import { Participant } from 'src/app/shared/models/participant';

@Component({
  selector: 'app-participant-status',
  templateUrl: './participant-status.component.html',
  styleUrls: ['./participant-status.component.scss']
})
export class ParticipantStatusComponent implements OnInit {

  private _participants: ParticipantResponse[];
  @Input() set participants(participants: ParticipantResponse[]) {
    this._participants = participants;
    this.filterNonJudgeParticipants();
  }
  nonJugdeParticipants: ParticipantResponse[];

  constructor() { }

  ngOnInit() {
    this.filterNonJudgeParticipants();
  }

  getParticipantStatusText(participant: ParticipantResponse): string {
    return new Participant(participant).getStatusAsText();
  }

  getParticipantStatusClass(participant): string {
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

  private filterNonJudgeParticipants(): void {
    this.nonJugdeParticipants = this._participants.filter(x => x.role !== UserRole.Judge);
  }

}
