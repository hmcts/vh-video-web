import { Injectable } from '@angular/core';
import * as signalR from '@aspnet/signalr';
import { AdalService } from 'adal-angular4';
import { Observable, Subject } from 'rxjs';
import {
  ConferenceStatus, ParticipantStatus, RoomType, ConsultationAnswer, AddSelfTestFailureEventRequest,
  SelfTestFailureReason, ConferenceResponse, ParticipantResponse
} from './clients/api-client';
import { ConfigService } from './api/config.service';
import { ConsultationMessage } from './models/consultation-message';
import { ConferenceStatusMessage } from './models/conference-status-message';
import { HelpMessage } from './models/help-message';
import { ParticipantStatusMessage } from './models/participant-status-message';
import { Logger } from './logging/logger-base';
import { AdminConsultationMessage } from './models/admin-consultation-message';
import { VideoWebService } from './api/video-web.service';
import { ActivatedRoute } from '@angular/router';
import { ErrorService } from './error.service';

@Injectable({
  providedIn: 'root'
})
export class EventsService {

  eventServiceBaseUri: string;
  connection: signalR.HubConnection;
  connectionStarted: boolean;
  attemptingConnection: boolean;
  conference: ConferenceResponse;
  participant: ParticipantResponse;
  private participantStatusSubject = new Subject<ParticipantStatusMessage>();
  private hearingStatusSubject = new Subject<ConferenceStatusMessage>();
  private helpMessageSubject = new Subject<HelpMessage>();
  private consultationMessageSubject = new Subject<ConsultationMessage>();
  private adminConsultationMessageSubject = new Subject<AdminConsultationMessage>();
  private connectionAttempt: number;

  constructor(
    private adalService: AdalService,
    private configService: ConfigService,
    private videoWebService: VideoWebService,
    private route: ActivatedRoute,
    private errorService: ErrorService,
    private logger: Logger) {
    this.connectionAttempt = 0;
    this.connectionStarted = false;
    this.eventServiceBaseUri = this.configService.clientSettings.video_api_url;
    this.connection = new signalR.HubConnectionBuilder()
      .configureLogging(signalR.LogLevel.Debug)
      .withUrl('/eventhub',
        {
          accessTokenFactory: () => this.adalService.userInfo.token
        })
      .build();
  }

  getConference(): void {
    const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
    this.videoWebService.getConferenceById(conferenceId)
      .subscribe((data: ConferenceResponse) => {
        this.conference = data;
        this.participant = data.participants.find(x => x.username.toLowerCase() === this.adalService.userInfo.userName.toLowerCase());
      },
        (error) => {
          if (!this.errorService.returnHomeIfUnauthorised(error)) {
            this.errorService.handleApiError(error);
          }
        });
  }

  start() {
    if (!this.connectionStarted && !this.attemptingConnection) {
      this.connectionAttempt++;
      this.attemptingConnection = true;
      this.connection
        .start()
        .then(() => {
          this.connectionAttempt = 0;
          this.connectionStarted = true;
          this.attemptingConnection = false;
          this.logger.info('Successfully connected to event hub');
          this.connection.onclose((error) => this.onEventHubErrorOrClose(error));
        })
        .catch(err => {
          this.logger.error('Failed to connect to event hub', err);
          this.onEventHubErrorOrClose(err);
        });
    }
  }

  private onEventHubErrorOrClose(error: Error) {
    this.connectionStarted = false;
    this.attemptingConnection = false;
    this.logger.error('EventHub connection closed', error);

    if (this.connectionAttempt < 6) {
      this.logger.info(`Attempting to re-connect to eventhub. Attempt #${this.connectionAttempt + 1}`);
      this.start();
    } else {
      this.videoWebService.raiseSelfTestFailureEvent(this.conference.id,
        new AddSelfTestFailureEventRequest({
          participant_id: this.participant.id,
          self_test_failure_reason: SelfTestFailureReason.Camera
        }))
        .subscribe(x => { },
          (eventError) => {
            console.error(eventError);
          });
    }
  }

  stop() {
    this.connection.stop().catch(err => this.logger.error('Failed to stop connection to event hub', err));
  }

  getParticipantStatusMessage(): Observable<ParticipantStatusMessage> {
    this.connection.on('ParticipantStatusMessage', (participantId: string, status: ParticipantStatus) => {
      const message = new ParticipantStatusMessage(participantId, status);
      this.logger.event('ParticipantStatusMessage received', message);
      this.participantStatusSubject.next(message);
    });

    return this.participantStatusSubject.asObservable();
  }

  getHearingStatusMessage(): Observable<ConferenceStatusMessage> {
    this.connection.on('ConferenceStatusMessage', (conferenceId: string, status: ConferenceStatus) => {
      const message = new ConferenceStatusMessage(conferenceId, status);
      this.logger.event('ConferenceStatusMessage received', message);
      this.hearingStatusSubject.next(message);
    });

    return this.hearingStatusSubject.asObservable();
  }

  getHelpMessage(): Observable<HelpMessage> {
    this.connection.on('HelpMessage', (conferenceId: string, participantName: string) => {
      const message = new HelpMessage(conferenceId, participantName);
      this.logger.event('HelpMessage received', message);
      this.helpMessageSubject.next(message);
    });

    return this.helpMessageSubject.asObservable();
  }

  getConsultationMessage(): Observable<ConsultationMessage> {
    this.connection.on('ConsultationMessage', (conferenceId: string, requestedBy: string, requestedFor: string, result: string) => {
      const message = new ConsultationMessage(conferenceId, requestedBy, requestedFor, result);
      this.logger.event('ConsultationMessage received', message);
      this.consultationMessageSubject.next(message);
    });

    return this.consultationMessageSubject.asObservable();
  }

  getAdminConsultationMessage(): Observable<AdminConsultationMessage> {
    this.connection.on('AdminConsultationMessage',
      (conferenceId: string, roomType: RoomType, requestedFor: string, answer: ConsultationAnswer) => {
        const message = new AdminConsultationMessage(conferenceId, roomType, requestedFor, answer);
        this.logger.event('AdminConsultationMessage received', message);
        this.adminConsultationMessageSubject.next(message);
      });

    return this.adminConsultationMessageSubject.asObservable();
  }
}
