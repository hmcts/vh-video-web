import { Component, Input } from '@angular/core';
import { ParticipantStatus, ParticipantForUserResponse } from 'src/app/services/clients/api-client';
import { Participant } from 'src/app/shared/models/participant';
import { ParticipantStatusModel } from 'src/app/shared/models/participants-status-model';
import { Logger } from 'src/app/services/logging/logger-base';
import { HeartbeatHealth } from '../../services/models/participant-heartbeat';

@Component({
  selector: 'app-participant-network-status',
  templateUrl: './participant-network-status.component.html',
  styleUrls: ['./participant-network-status.component.scss']
})
export class ParticipantNetworkStatusComponent  {
  @Input() participant: Participant;

  constructor(private logger: Logger) {
    // this.logger.debug("***************Participant *************** " + this.participant.displayName);
  }

  getParticipantNetworkStatus(): string {
    if(this.participant.status === ParticipantStatus.Disconnected){
       return 'participant-disconnected';
    }

    switch (this.participant.hearbeartHealth) {
      case HeartbeatHealth.Good:
        return "Good";
      case HeartbeatHealth.Bad:
        return 'Bad';
      case HeartbeatHealth.Poor:
        return 'Poor';
      case HeartbeatHealth.None:
        return 'None';
      default:
        return 'None';
    }
  }

}
