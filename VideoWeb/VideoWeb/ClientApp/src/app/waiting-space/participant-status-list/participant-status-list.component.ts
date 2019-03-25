import { Component, OnInit, Input } from '@angular/core';
import { ConferenceResponse, ParticipantResponse, ParticipantRole, ParticipantStatus } from 'src/app/services/clients/api-client';

@Component({
  selector: 'app-participant-status-list',
  templateUrl: './participant-status-list.component.html',
  styleUrls: ['./participant-status-list.component.css']
})
export class ParticipantStatusListComponent implements OnInit {

  @Input() conference: ConferenceResponse;

  nonJugdeParticipants: ParticipantResponse[];
  judge: ParticipantResponse;

  constructor() { }

  ngOnInit() {
    this.filterNonJudgeParticipants();
    this.filterJudge();
  }

  isParticipantAvailable(participant: ParticipantResponse): boolean {
    return participant.status === ParticipantStatus.Available;
  }

  private filterNonJudgeParticipants(): void {
    this.nonJugdeParticipants = this.conference.participants.filter(x => x.role !== ParticipantRole.Judge);
  }

  private filterJudge(): void {
    this.judge = this.conference.participants.find(x => x.role === ParticipantRole.Judge);
  }

}
