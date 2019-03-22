import { Injectable } from '@angular/core';
import { AdalService } from 'adal-angular4';
import * as signalR from '@aspnet/signalr';
import { ConfigService } from './config.service';
import { ParticipantStatusMessage } from './models/participant-status-message';
import { Observable, Subject } from 'rxjs';
import { HearingStatusMessage } from './models/hearing-status-message';
import { HelpMessage } from './models/help-message';
import { ConsultationMessage } from './models/consultation-message';

@Injectable({
  providedIn: 'root'
})
export class ServerSentEventsService {

  eventServiceBaseUri: string;
  connection: signalR.HubConnection;
  connectionStarted: boolean;
  private participantStatusSubject = new Subject<ParticipantStatusMessage>();
  private hearingStatusSubject = new Subject<HearingStatusMessage>();
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
    this.connection.on('ParticipantStatusMessage', (email: string, status: string) => {
      this.participantStatusSubject.next(new ParticipantStatusMessage(email, status));
    });

    return this.participantStatusSubject.asObservable();
  }

  getHearingStatusMessage(): Observable<HearingStatusMessage> {
    this.connection.on('hearingStatusMessage', (conferenceId: string, status: string) => {
      this.hearingStatusSubject.next(new HearingStatusMessage(conferenceId, status));
    });

    return this.hearingStatusSubject.asObservable();
  }

  getHelpMessage(): Observable<HelpMessage> {
    this.connection.on('helpMessage', (conferenceId: string, participantName: string) => {
      this.helpMessageSubject.next(new HelpMessage(conferenceId, participantName));
    });

    return this.helpMessageSubject.asObservable();
  }

  getConsultationMessage(): Observable<ConsultationMessage> {
    this.connection.on('consultationMessage', (conferenceId: string, requestedBy: string, requestedFor: string, result: string) => {
      this.consultationMessageSubject.next(new ConsultationMessage(conferenceId, requestedBy, requestedFor, result));
    });

    return this.consultationMessageSubject.asObservable();
  }
}
