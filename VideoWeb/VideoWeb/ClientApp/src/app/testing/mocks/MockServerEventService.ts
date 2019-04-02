import { ClientSettingsResponse, ConferenceStatus, ParticipantStatus } from '../../services/clients/api-client';
import { Observable, of } from 'rxjs';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { HearingStatusMessage } from 'src/app/services/models/hearing-status-message';
import { HelpMessage } from 'src/app/services/models/help-message';
import { ConsultationMessage } from 'src/app/services/models/consultation-message';

export class MockServerSentEventsService {

  nextParticipantStatusMessage: ParticipantStatusMessage;
  nextHearingStatusMessage: HearingStatusMessage;
  nextHelpMessage: HelpMessage;
  nextConsultationMessage: ConsultationMessage;

  constructor() {
    this.nextParticipantStatusMessage = new ParticipantStatusMessage('chris.green@hearings.net', ParticipantStatus.Available);
    this.nextHearingStatusMessage = new HearingStatusMessage('612AB52C-BDA5-4F4D-95B8-3F49065219A6', ConferenceStatus.InSession);
    this.nextHelpMessage = new HelpMessage('612AB52C-BDA5-4F4D-95B8-3F49065219A6', 'chris.green@hearings.net');
    this.nextConsultationMessage = new ConsultationMessage('612AB52C-BDA5-4F4D-95B8-3F49065219A6', 'chris.green@hearings.net',
      'james.green@hearings.net', null);
  }

  start() { }
  stop() { }

  getParticipantStatusMessage(): Observable<ParticipantStatusMessage> {
    return of(this.nextParticipantStatusMessage);
  }

  getHearingStatusMessage(): Observable<HearingStatusMessage> {
    return of(this.nextHearingStatusMessage);
  }

  getHelpMessage(): Observable<HelpMessage> {
    return of(this.nextHelpMessage);
  }

  getConsultationMessage(): Observable<ConsultationMessage> {
    return of(this.nextConsultationMessage);
  }
}
