import { Component, Input } from '@angular/core';
import { ParticipantStatus } from 'src/app/services/clients/api-client';
import { ParticipantSummary } from '../../shared/models/participant-summary';

@Component({
  selector: 'app-participant-network-status',
  templateUrl: './participant-network-status.component.html',
  styleUrls: ['./participant-network-status.component.scss']
})
export class ParticipantNetworkStatusComponent  {
  @Input() participant: ParticipantSummary;

  constructor() {
  }

  getParticipantNetworkStatus(): string {
    if (this.participant === undefined || this.participant.participantHertBeatHealth === undefined) {
      return 'not-signed-in.png';
    }

    console.log('******************* Particpant ************************ ' + JSON.stringify(this.participant));
    // if(this.participant.status === ParticipantStatus.Disconnected){
   //    return 'participant-disconnected';
   // }

    console.log('******************* Heart Beat ************************ ' + JSON.stringify(this.participant.participantHertBeatHealth));

    switch (this.participant.status) {
      case ParticipantStatus.Disconnected:
        return 'disconnected.png';
      case ParticipantStatus.Available:
        return 'good-signal.png';
      case ParticipantStatus.InConsultation:
        return 'poor-signal.png';
      case ParticipantStatus.NotSignedIn:
        return 'not-signed-in.png';
      case ParticipantStatus.None:
        return 'incompatible-browser-signal.png';
      default:
        return 'incompatible-browser-signal.png';
    }
  }
}
