import { Observable, of } from 'rxjs';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { ConsultationMessage } from 'src/app/services/models/consultation-message';
import { HelpMessage } from 'src/app/services/models/help-message';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';

import {
  ConferenceStatus,
  ParticipantStatus,
  RoomType,
  ConsultationAnswer
} from '../../services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { AdminConsultationMessage } from 'src/app/services/models/admin-consultation-message';

export class MockEventsService {
  nextParticipantStatusMessage: ParticipantStatusMessage;
  nextHearingStatusMessage: ConferenceStatusMessage;
  nextHelpMessage: HelpMessage;
  nextConsultationMessage: ConsultationMessage;
  nextAdminConsultationMessage: AdminConsultationMessage;

  constructor() {
    this.nextParticipantStatusMessage = new ParticipantStatusMessage(
      '9F681318-4955-49AF-A887-DED64554429D',
      ParticipantStatus.Available
    );
    this.nextHearingStatusMessage = new ConferenceStatusMessage(
      '612AB52C-BDA5-4F4D-95B8-3F49065219A6',
      ConferenceStatus.InSession
    );
    this.nextHelpMessage = new HelpMessage(
      '612AB52C-BDA5-4F4D-95B8-3F49065219A6',
      'chris.green@hearings.net'
    );
    this.nextConsultationMessage = new ConsultationMessage(
      '612AB52C-BDA5-4F4D-95B8-3F49065219A6',
      'chris.green@hearings.net',
      'james.green@hearings.net',
      null
    );
    this.nextAdminConsultationMessage = new AdminConsultationMessage(
      '612AB52C-BDA5-4F4D-95B8-3F49065219A6',
      RoomType.ConsultationRoom1,
      'james.green@hearings.net',
      ConsultationAnswer.None
    );
  }

  start() {}
  stop() {}

  getParticipantStatusMessage(): Observable<ParticipantStatusMessage> {
    return of(this.nextParticipantStatusMessage);
  }

  getHearingStatusMessage(): Observable<ConferenceStatusMessage> {
    return of(this.nextHearingStatusMessage);
  }

  getHelpMessage(): Observable<HelpMessage> {
    return of(this.nextHelpMessage);
  }

  getConsultationMessage(): Observable<ConsultationMessage> {
    return of(this.nextConsultationMessage);
  }

  getAdminConsultationMessage(): Observable<AdminConsultationMessage> {
    return of(this.nextAdminConsultationMessage);
  }

  getServiceDisconnected(): Observable<any> {
    return of(true);
  }

  getServiceReconnected(): Observable<any> {
    return of(true);
  }
}

export class MockEventsNonHttpService extends EventsService {
  start() {}
  stop() {}
}
