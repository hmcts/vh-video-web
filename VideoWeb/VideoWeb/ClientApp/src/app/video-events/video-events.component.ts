import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VideoWebService } from 'src/app/services/video-web.service';
import { ConferenceResponse, ConferenceEventRequest, EventType, RoomType} from 'src/app/services/clients/api-client';
import { Guid } from 'guid-typescript';

@Component({
  selector: 'app-video-events',
  templateUrl: './video-events.component.html',
  styleUrls: ['./video-events.component.css']
})
export class VideoEventsComponent implements OnInit {

  private conferenceId: number;
  conference: ConferenceResponse;

  constructor(
    private route: ActivatedRoute,
    private apiClient: VideoWebService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.conferenceId = +params['conferenceId'];
      this.getHearingDetails();
    });
  }

  private buildBasicEventRequest(conferenceId: string): ConferenceEventRequest {
    return new ConferenceEventRequest({
      time_stamp_utc: new Date(new Date().getUTCDate()),
      conference_id: conferenceId,
      event_id: Guid.create().toString()
    });
  }

  getHearingDetails() {
    this.apiClient.getConferenceById(this.conferenceId.toString())
      .subscribe((data: ConferenceResponse) => {
        this.conference = data;
      });
  }

  pauseHearing(conferenceId: string) {
    const request = this.buildBasicEventRequest(conferenceId);
    request.event_type = EventType.Pause;
    request.participant_id = this.conference[0].participants.find(x => x.role === 'Judge').participant_id;
    this.sendEvent(request);
  }

  endHearing(conferenceId: string) {
    const request = this.buildBasicEventRequest(conferenceId);
    request.event_type = EventType.Close;
    request.participant_id = this.conference[0].participants.find(x => x.role === 'Judge').participant_id;
    this.sendEvent(request);
  }

  joinHearing(conferenceId: string, participantUuid: string) {
    const request = this.buildBasicEventRequest(conferenceId);
    request.participant_id = participantUuid;
    request.event_type = EventType.Joined;
    this.sendEvent(request);
  }

  leaveHearing(conferenceId: string, participantUuid: string) {
    const request = this.buildBasicEventRequest(conferenceId);
    request.participant_id = participantUuid;
    request.event_type = EventType.Leave;
    this.sendEvent(request);
  }

  disconnectFromHearing(conferenceId: string, participantUuid: string) {
    const request = this.buildBasicEventRequest(conferenceId);
    request.participant_id = participantUuid;
    request.event_type = EventType.Disconnected;
    this.sendEvent(request);
  }

  requestHelp(conferenceId: string, participantUuid: string) {
    const request = this.buildBasicEventRequest(conferenceId);
    request.participant_id = participantUuid;
    request.event_type = EventType.Help;
    this.sendEvent(request);
  }

  transferToWaitingRoom(conferenceId: string, participantUuid: string) {
    const request = this.buildBasicEventRequest(conferenceId);
    request.participant_id = participantUuid;
    request.event_type = EventType.Transfer;
    request.transfer_from = RoomType.HearingRoom;
    request.transfer_to = RoomType.WaitingRoom;
    this.sendEvent(request);
  }

  transferToHearingRoomFromConsultationRoom(conferenceId: string, participantUuid: string) {
    const request = this.buildBasicEventRequest(conferenceId);
    request.participant_id = participantUuid;
    request.event_type = EventType.Transfer;
    request.transfer_from = RoomType.ConsultationRoom1;
    request.transfer_to = RoomType.WaitingRoom;
    this.sendEvent(request);
  }

  transferToHearingRoom(conferenceId: string, participantUuid: string) {
    const request = this.buildBasicEventRequest(conferenceId);
    request.participant_id = participantUuid;
    request.event_type = EventType.Transfer;
    request.transfer_from = RoomType.WaitingRoom;
    request.transfer_to = RoomType.HearingRoom;
    this.sendEvent(request);
  }

  transferToConsultationRoom1(conferenceId: string, participantUuid: string) {
    const request = this.buildBasicEventRequest(conferenceId);
    request.participant_id = participantUuid;
    request.event_type = EventType.Transfer;
    request.transfer_from = RoomType.WaitingRoom;
    request.transfer_to = RoomType.ConsultationRoom1;
    this.sendEvent(request);
  }

  transferToConsultationRoom2(conferenceId: string, participantUuid: string) {
    const request = this.buildBasicEventRequest(conferenceId);
    request.participant_id = participantUuid;
    request.event_type = EventType.Transfer;
    request.transfer_from = RoomType.WaitingRoom;
    request.transfer_to = RoomType.ConsultationRoom2;
    this.sendEvent(request);
  }

  private sendEvent(request: ConferenceEventRequest) {
    this.apiClient.sendEvent(request)
      .subscribe(() => {
        console.log('successfuly sent event...');
      }, error => {
        console.error('failed to send request');
        console.error(error);
      });
  }
}
