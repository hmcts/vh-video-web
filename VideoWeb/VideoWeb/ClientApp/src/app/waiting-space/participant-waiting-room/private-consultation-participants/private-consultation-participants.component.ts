import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ParticipantResponse, ParticipantStatus, VideoEndpointResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { WRParticipantStatusListDirective } from '../../waiting-room-shared/wr-participant-list-shared.component';

@Component({
  selector: 'app-private-consultation-participants',
  templateUrl: './private-consultation-participants.component.html',
  styleUrls: ['./private-consultation-participants.component.scss']
})
export class PrivateConsultationParticipantsComponent extends WRParticipantStatusListDirective implements OnInit, OnDestroy {
  @Input() roomLabel: string;

  constructor(
    protected adalService: AdalService,
    protected consultationService: ConsultationService,
    protected eventService: EventsService,
    protected logger: Logger,
    protected videoWebService: VideoWebService
  ) {
    super(adalService, consultationService, eventService, videoWebService, logger);
    this.loggerPrefix = "[PrivateConsultationParticipantsComponent] - ";
  }

  ngOnInit(): void {
    this.initParticipants();
    this.setupSubscribers();
    this.setupInviteStatusSubscribers();
  }

  ngOnDestroy() {
    this.executeTeardown();
  }

  participantCallStatuses = [];

  setupInviteStatusSubscribers() {
    this.logger.debug(`${this.loggerPrefix} Subscribing to ConsultationRequestResponseMessage`);
    this.eventHubSubscriptions$.add(
        this.eventService.getConsultationRequestResponseMessage().subscribe(message => {
            if (message.roomLabel == this.roomLabel && message.conferenceId == this.conference.id) {
              this.participantCallStatuses[message.requestedFor] = message.answer;
              setTimeout(() => {
                if (this.participantCallStatuses[message.requestedFor] == message.answer) {
                  this.participantCallStatuses[message.requestedFor] = null;
                }
              }, 5000);
            }
        })
    );

    this.logger.debug(`${this.loggerPrefix} Subscribing to RequestedConsultationMessage`);
    this.eventHubSubscriptions$.add(
        this.eventService.getRequestedConsultationMessage().subscribe(message => {
            // Set "Calling..."
            // No need to timeout here the text because when the notification times out it will send another event.
            if (message.roomLabel == this.roomLabel && message.conferenceId == this.conference.id) {
              this.participantCallStatuses[message.requestedFor] = 'Calling';
            }
        })
    );

    this.logger.debug(`${this.loggerPrefix} Subscribing to ParticipantStatusMessage`);
    this.eventHubSubscriptions$.add(
        this.eventService.getParticipantStatusMessage().subscribe(message => {
            // If the participant state changes reset the state.
            this.participantCallStatuses[message.participantId] = null;
        })
    );
  }

  getRowClasses(participant: ParticipantResponse): string {
    let statusClasses = 'govuk-table__row';
    if (this.participantIsInCurrentRoom(participant)) {
      return `${statusClasses} active`;
    }

    return statusClasses;
  }

  getParticipantStatus(participant: ParticipantResponse): string {
    if (this.participantIsInCurrentRoom(participant)) {
      return '';
    }
    if (participant.current_room?.label)
    {
      return this.camelToSpaced(participant.current_room?.label.replace('ParticipantConsultation', ''));
    }
    return this.camelToSpaced(participant.status);
  }

  participantIsInCurrentRoom(participant: ParticipantResponse): boolean {
    return participant.current_room?.label === this.roomLabel;
  }

  getParticipantStatusClasses(participant: ParticipantResponse): string {
    switch (participant.status) {
      case ParticipantStatus.InConsultation:
        if (this.participantIsInCurrentRoom(participant)) {
          return '';
        }
        return 'outline';
      default:
        return '';
    }
  }

  participantIsInRoom(participant: ParticipantResponse): boolean {
    return participant.current_room?.label === this.roomLabel;
  }

  setupSubscribers(): void {
    this.addSharedEventHubSubcribers();
  }

  canCallParticipant(participant: ParticipantResponse): boolean {
    return !this.participantIsInRoom(participant) && participant.status === ParticipantStatus.Available;
  }

  canCallEndpoint(endpoint: VideoEndpointResponse): boolean {
    return true;
  }

}
