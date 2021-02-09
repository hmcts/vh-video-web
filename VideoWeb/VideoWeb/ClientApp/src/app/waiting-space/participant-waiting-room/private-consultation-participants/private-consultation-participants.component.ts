import { Component, Input, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ParticipantResponse, VideoEndpointResponse } from 'src/app/services/clients/api-client';
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
    return 'govuk-table__row';
  }

  getParticipantStatus(participant: ParticipantResponse): string {
    return this.camelToSpaced(participant.status);
  }

  getParticipantStatusClasses(participant: ParticipantResponse): string {
    return 'govuk-table__cell';
  }

  participantIsInRoom(participant: ParticipantResponse):boolean{
    if (participant.current_room.label === this.roomLabel) {
      return true;
    }

    return false;
    // const currentRoom = this.camelToSpaced(participant.current_room.label.replace('ParticipantConsultationRoom', 'MeetingRoom')).toLowerCase();
    // if (currentRoom = ) {
      
    // }
    // return part.base.current_rParticipantoom?.label === this.roomId;
  }

  setupSubscribers(): void {
    this.addSharedEventHubSubcribers();
  }

  canCallParticipant(participant: ParticipantResponse): boolean {
    return true;
  }

  canCallEndpoint(endpoint: VideoEndpointResponse): boolean {
    return true;
  }

}
