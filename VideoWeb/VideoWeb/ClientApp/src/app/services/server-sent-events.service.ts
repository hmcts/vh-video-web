import { Injectable } from '@angular/core';
import * as signalR from '@aspnet/signalr';
import { AdalService } from 'adal-angular4';
import { Observable, Subject } from 'rxjs';
import { ConferenceStatus, ParticipantStatus } from './clients/api-client';
import { ConfigService } from './config.service';
import { ConsultationMessage } from './models/consultation-message';
import { ConferenceStatusMessage } from './models/conference-status-message';
import { HelpMessage } from './models/help-message';
import { ParticipantStatusMessage } from './models/participant-status-message';

@Injectable({
  providedIn: 'root'
})
export class ServerSentEventsService {

  eventServiceBaseUri: string;
  connection: signalR.HubConnection;
  connectionStarted: boolean;
  private participantStatusSubject = new Subject<ParticipantStatusMessage>();
  private hearingStatusSubject = new Subject<ConferenceStatusMessage>();
  private helpMessageSubject = new Subject<HelpMessage>();
  private consultationMessageSubject = new Subject<ConsultationMessage>();

  constructor(
    private adalService: AdalService,
    private configService: ConfigService) {
    this.connectionStarted = false;
    this.eventServiceBaseUri = this.configService.clientSettings.video_api_url;
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(this.eventServiceBaseUri + '/eventhub?access_token=' + this.adalService.userInfo.token)
      .build();
  }

  start() {
    if (!this.connectionStarted) {
      this.connection
        .start()
        .then(() => {
          this.connectionStarted = true;
        })
        .catch(err => console.error(err));
    }
  }

  stop() {
    this.connection.stop().catch(err => console.error(err));
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
