import {Component, Input, OnInit} from '@angular/core';
import {ParticipantStatus, Role} from 'src/app/services/clients/api-client';
import {VideoWebService} from '../../services/api/video-web.service';
import {ErrorService} from '../../services/error.service';
import {Logger} from '../../services/logging/logger-base';
import {ParticipantContactDetails} from '../../shared/models/participant-contact-details';
import {ParticipantStatusMessage} from '../../services/models/participant-status-message';
import {Subscription} from 'rxjs';
import {EventsService} from '../../services/events.service';
import {ParticipantStatusReader} from '../../shared/models/participant-status-reader';
import {JudgeHearingStatus} from '../../shared/models/judge-hearing-status';

@Component({
  selector: 'app-participant-status',
  templateUrl: './participant-status.component.html',
  styleUrls: ['./participant-status.component.scss']
})
export class ParticipantStatusComponent implements OnInit {
  loadingData: boolean;
  participants: ParticipantContactDetails[];
  eventHubSubscriptions: Subscription = new Subscription();

  @Input() conferenceId: string;
  @Input() hearingVenueName: string;
  _judgeStatuses: JudgeHearingStatus[];

  @Input() set judgeStatuses(judgeStatuses: JudgeHearingStatus[]) {
    this._judgeStatuses = judgeStatuses;
    console.log('****OnSet: ' + JSON.stringify(judgeStatuses));
  }

  // Re jig the input of statuses and pass in custom obj, all I want to know is which Judges are in a hearing. Then
  // here i can say go load participants again to say "in another hearing" if other judge by username is in a hearing
  // Store judge usernames in a cache e.g.  profiles: Record<string, UserProfileResponse> = {};

  constructor(private videoWebService: VideoWebService, private errorService: ErrorService,
              private eventService: EventsService, private logger: Logger,
              private participantStatusReader: ParticipantStatusReader) {
    this.loadingData = true;
  }

  async ngOnInit(): Promise<any> {
    await this.setupEventHubSubscribers();
    await this.LoadParticipants();
  }

  async LoadParticipants() {
    this.logger.info('Loading VH Officer Dashboard Participant Status list');

    const participantDetails = await this.getParticipantsByConference(this.conferenceId);

    this.participants = participantDetails.map(x => {
      const participant = new ParticipantContactDetails(x);
      this.SetParticipantStatus(participant.status, participant);

      return participant;
    });

    this.loadingData = false;
  }

  async getParticipantsByConference(conferenceId: string) {
    try {
      return await this.videoWebService.getParticipantsByConferenceIdVho(conferenceId);
    } catch (error) {
      this.logger.error('There was an error getting the VH Officer dashboard participant status list of names', error);
      this.loadingData = false;
      this.errorService.handleApiError(error);
    }
  }

  SetParticipantStatus(participantStatus: ParticipantStatus, participant: ParticipantContactDetails) {
    participant.status = participantStatus;

    if (participant.role === Role.Judge) {
      //console.log('****this._judgeStatuses: ' + JSON.stringify(this._judgeStatuses));
      const judgeFromOtherConference = this._judgeStatuses.find(x => x.username === participant.username && x.status === ParticipantStatus.InHearing);
      //console.log('****JudgeInOtherConference: ' + JSON.stringify(judgeFromOtherConference));
      participant.statusText = judgeFromOtherConference
        ? this.participantStatusReader.inAnotherHearingText
        : this.participantStatusReader.getStatusAsTextForJudge(participantStatus);
    } else {
      participant.statusText = this.participantStatusReader.getStatusAsText(participantStatus);
    }
  }

  async setupEventHubSubscribers() {
    this.logger.debug('Subscribing to participant status changes...');
    this.eventHubSubscriptions.add(
      this.eventService.getParticipantStatusMessage().subscribe(async (message) => {
        await this.handleParticipantStatusChange(message);
      })
    );

    this.logger.debug('Subscribing to EventHub reconnects');
    this.eventHubSubscriptions.add(
      this.eventService.getServiceReconnected().subscribe(async () => {
        this.logger.info(`EventHub reconnected for vh officer`);
        await this.refreshConferenceDataDuringDisconnect();
      })
    );
  }

  async handleParticipantStatusChange(message: ParticipantStatusMessage): Promise<void> {
    if (!this.participants) {
      return;
    }

    const participant = this.participants.find((x) => x.id === message.participantId);
    if (participant) {
      this.SetParticipantStatus(message.status, participant);
    }
  }

  async refreshConferenceDataDuringDisconnect(): Promise<void> {
    this.logger.warn('EventHub refresh pending...');
    await this.LoadParticipants();
  }

  getParticipantStatusClass(state: ParticipantStatus): string {
    switch (state) {
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
