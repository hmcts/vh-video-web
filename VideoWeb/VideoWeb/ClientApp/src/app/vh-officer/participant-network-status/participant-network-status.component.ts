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


    


   if(this.participant.status === ParticipantStatus.Disconnected){
       return 'participant-disconnected';
    }

    

    // switch (this.participant.hearbeartHealth) {
    //  case HeartbeatHealth.Good:
    //    return "Good";
    //  case HeartbeatHealth.Bad:
    //    return 'Bad';
    //  case HeartbeatHealth.Poor:
    //    return 'Poor';
    //  case HeartbeatHealth.None:
    //    return 'None';
    //  default:
    //    return 'None';
    // }
  }

}
