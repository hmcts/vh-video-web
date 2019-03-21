import { Injectable } from '@angular/core';
import { AdalService } from 'adal-angular4';
import * as signalR from '@aspnet/signalr';
import { ConfigService } from './config.service';
import { ParticipantStatusMessage } from './models/participant-status-message';
import { Observable, Subject } from 'rxjs';
import { HearingStatusMessage } from './models/hearing-status-message';

@Injectable({
  providedIn: 'root'
})
export class ServerSentEventsService {

  eventServiceBaseUri: string;
  connection: signalR.HubConnection;
  connectionStarted: boolean;
  participantStatusSubject = new Subject<ParticipantStatusMessage>();
  hearingStatusSubject = new Subject<HearingStatusMessage>();

  constructor(
    private adalService: AdalService,
    private configService: ConfigService) {
    this.eventServiceBaseUri = this.configService.clientSettings.video_api_url;
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(this.eventServiceBaseUri + '/EventHub?access_token=' + this.adalService.userInfo.token)
      .build();

    this.connectionStarted = false;
  }

  start() {
    console.log('connection status:  ' + this.connectionStarted);
    if (!this.connectionStarted) {
      this.connection.start().catch(err => console.error(err));
      this.connectionStarted = true;
    }
  }

  stop() {
    this.connection.stop().catch(err => console.error(err));
  }

  getParticipantStatusMessage(): Observable<ParticipantStatusMessage> {
    this.connection.on('participantStatusMessage', (email: string, status: string) => {
      this.participantStatusSubject.next(new ParticipantStatusMessage(email, status));
    });

    return this.participantStatusSubject.asObservable();
  }

  getHearingStatusMessage(): Observable<HearingStatusMessage> {
    this.connection.on('hearingStatusMessage', (hearingId: number, status: string) => {
      this.hearingStatusSubject.next(new HearingStatusMessage(hearingId, status));
    });

    return this.hearingStatusSubject.asObservable();
  }
}
