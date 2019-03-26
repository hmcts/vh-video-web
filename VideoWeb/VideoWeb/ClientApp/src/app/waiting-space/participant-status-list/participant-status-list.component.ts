import { Component, OnInit, Input } from '@angular/core';
import { ConferenceResponse, ParticipantResponse, UserRole, ParticipantStatus } from 'src/app/services/clients/api-client';
import { AdalService } from 'adal-angular4';

@Component({
  selector: 'app-participant-status-list',
  templateUrl: './participant-status-list.component.html',
  styleUrls: ['./participant-status-list.component.css']
})
export class ParticipantStatusListComponent implements OnInit {

  @Input() conference: ConferenceResponse;

  nonJugdeParticipants: ParticipantResponse[];
  judge: ParticipantResponse;

  constructor(private adalService: AdalService) { }

  ngOnInit() {
    this.filterNonJudgeParticipants();
    this.filterJudge();
  }

  isParticipantAvailable(participant: ParticipantResponse): boolean {
    return participant.status === ParticipantStatus.Available;
  }

  getParticipantStatusText(participant: ParticipantResponse): string {
    return participant.status === ParticipantStatus.Available ? 'Available' : 'Unavailable';
  }

  canCallParticipant(participant: ParticipantResponse): boolean {
    if (participant.username === this.adalService.userInfo.userName) {
      return false;
    }
    return this.isParticipantAvailable(participant);
  }

  begingCallWith(participant: ParticipantResponse): void {
    if (this.canCallParticipant(participant)) {
      this.raiseConsultationRequestEvent(participant);
    }
  }

  private raiseConsultationRequestEvent(participant: ParticipantResponse): void {
    throw Error('Not Implemented');
  }

  private filterNonJudgeParticipants(): void {
    this.nonJugdeParticipants = this.conference.participants.filter(x => x.role !== UserRole.Judge);
  }

  private filterJudge(): void {
    this.judge = this.conference.participants.find(x => x.role === UserRole.Judge);
  }

}
