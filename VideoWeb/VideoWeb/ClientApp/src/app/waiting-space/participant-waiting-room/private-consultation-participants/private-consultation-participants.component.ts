import { Component, Input, OnInit } from '@angular/core';
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
export class PrivateConsultationParticipantsComponent extends WRParticipantStatusListDirective implements OnInit {
  @Input() roomLabel: string;

  constructor(
    protected adalService: AdalService,
    protected consultationService: ConsultationService,
    protected eventService: EventsService,
    protected logger: Logger,
    protected videoWebService: VideoWebService
  ) {
    super(adalService, consultationService, eventService, videoWebService, logger);
  }

  ngOnInit(): void {
    this.initParticipants();
    this.setupSubscribers();
  }

  getRowClasses(participant: ParticipantResponse): string {
    let statusClasses = 'govuk-table__row';
    if (participant.current_room?.label === this.roomLabel) {
      return `${statusClasses} active`;
    }

    return statusClasses;
  }

  getParticipantStatus(participant: ParticipantResponse): string {
    return this.camelToSpaced(participant.status);
  }

  getParticipantStatusClasses(participant: ParticipantResponse): string {
    let statusClasses = 'govuk-table__cell';
    switch (participant.status) {
      case ParticipantStatus.InConsultation:
        return `${statusClasses} outline`;
    
      default:
        return statusClasses;
    }
  }

  participantIsInRoom(participant: ParticipantResponse):boolean{
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
