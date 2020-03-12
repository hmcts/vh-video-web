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
   

    console.log("******************* Heart Beat ************************" + this.participant.participantHertBeatHealth);
    //if (this.participant.participantHertBeatHealth.browserName.toLowerCase() == "edge" || this.participant.participantHertBeatHealth.browserName.toLowerCase() == "safari") {
    //  return 'incompatible-browser-signal.png';
    //}
    //else {
    //  if (this.participant.status === ParticipantStatus.Disconnected) {
    //    return 'disconnected.png';
    //  }
    //  else {
    //  }
    //}
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
