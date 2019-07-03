import { Injectable } from '@angular/core';
import * as signalR from '@aspnet/signalr';
import { AdalService } from 'adal-angular4';
import { Observable, Subject } from 'rxjs';
import { ConferenceStatus, ParticipantStatus } from './clients/api-client';
import { ConfigService } from './api/config.service';
import { ConsultationMessage } from './models/consultation-message';
import { ConferenceStatusMessage } from './models/conference-status-message';
import { HelpMessage } from './models/help-message';
import { ParticipantStatusMessage } from './models/participant-status-message';
import { Logger } from './logging/logger-base';

@Injectable({
  providedIn: 'root'
})
export class EventsService {

  eventServiceBaseUri: string;
  connection: signalR.HubConnection;
  connectionStarted: boolean;
  attemptingConnection: boolean;
  private participantStatusSubject = new Subject<ParticipantStatusMessage>();
  private hearingStatusSubject = new Subject<ConferenceStatusMessage>();
  private helpMessageSubject = new Subject<HelpMessage>();
  private consultationMessageSubject = new Subject<ConsultationMessage>();

  constructor(
    private adalService: AdalService,
    private configService: ConfigService,
    private logger: Logger) {
    this.connectionStarted = false;
    this.eventServiceBaseUri = this.configService.clientSettings.video_api_url;
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(this.eventServiceBaseUri + '/eventhub?access_token=' + this.adalService.userInfo.token)
      .build();
  }

  start() {
    if (!this.connectionStarted && !this.attemptingConnection) {
      this.attemptingConnection = true;
      this.connection
        .start()
        .then(() => {
          this.connectionStarted = true;
          this.attemptingConnection = false;
        })
        .catch(err => {
          this.attemptingConnection = false;
          this.logger.error('Failed to connect to event hub', err);
        });
    }
  }

  stop() {
    this.connection.stop().catch(err => this.logger.error('Failed to stop connection to event hub', err));
  }

  getParticipantStatusMessage(): Observable<ParticipantStatusMessage> {
    this.connection.on('ParticipantStatusMessage', (email: string, status: ParticipantStatus) => {
      this.participantStatusSubject.next(new ParticipantStatusMessage(email, status));
    });

    return this.participantStatusSubject.asObservable();
  }

  getHearingStatusMessage(): Observable<ConferenceStatusMessage> {
    this.connection.on('ConferenceStatusMessage', (conferenceId: string, status: ConferenceStatus) => {
      this.hearingStatusSubject.next(new ConferenceStatusMessage(conferenceId, status));
    });

    return this.hearingStatusSubject.asObservable();
  }

  getHelpMessage(): Observable<HelpMessage> {
    this.connection.on('HelpMessage', (conferenceId: string, participantName: string) => {
      this.helpMessageSubject.next(new HelpMessage(conferenceId, participantName));
    });

    return this.helpMessageSubject.asObservable();
  }

  getConsultationMessage(): Observable<ConsultationMessage> {
    this.connection.on('ConsultationMessage', (conferenceId: string, requestedBy: string, requestedFor: string, result: string) => {
      this.consultationMessageSubject.next(new ConsultationMessage(conferenceId, requestedBy, requestedFor, result));
    });

    return this.consultationMessageSubject.asObservable();
  }
}
