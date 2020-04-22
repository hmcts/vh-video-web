import {Component, Input, OnInit} from '@angular/core';
import {ParticipantStatus} from 'src/app/services/clients/api-client';
import {VideoWebService} from '../../services/api/video-web.service';
import {ErrorService} from '../../services/error.service';
import {Logger} from '../../services/logging/logger-base';
import {ParticipantContactDetails} from '../../shared/models/participant-contact-details';

@Component({
  selector: 'app-participant-status',
  templateUrl: './participant-status.component.html',
  styleUrls: ['./participant-status.component.scss']
})
export class ParticipantStatusComponent implements OnInit {
  loadingData: boolean;
  participants: ParticipantContactDetails[];

  @Input() conferenceId: string;
  @Input() hearingVenueName: string;
  @Input() judgeStatuses: ParticipantStatus[];

  constructor(private videoWebService: VideoWebService, private errorService: ErrorService, private logger: Logger) {
    this.loadingData = true;
  }

  async ngOnInit(): Promise<any> {
    this.logger.info('Loading VH Officer Dashboard Participant Status list');

    try {
      const participantDetails = await this.videoWebService.getParticipantsByConferenceIdVho(this.conferenceId);

      this.loadingData = false;
      this.participants = participantDetails.map(x => new ParticipantContactDetails(x));
    } catch (error) {
      this.logger.error('There was an error getting the VH Officer dashboard participant status list of names', error);
      this.loadingData = false;
      this.errorService.handleApiError(error);
    }
  }
  // Need to handle participant status change

  getParticipantStatusClass(participant: ParticipantContactDetails): string {
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
