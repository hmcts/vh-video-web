import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Guid } from 'guid-typescript';
import { ConferenceEventRequest, ConferenceResponse, EventType, ParticipantResponse, RoomType } from '../services/clients/api-client';
import { VideoWebService } from '../services/api/video-web.service';
import { PageUrls } from '../shared/page-url.constants';
import { ErrorService } from '../services/error.service';
import { Logger } from '../services/logging/logger-base';

@Component({
    selector: 'app-send-video-events',
    templateUrl: './send-video-events.component.html',
    styleUrls: ['./send-video-events.component.css']
})
export class SendVideoEventsComponent implements OnInit {
    loadingData: boolean;
    conference: ConferenceResponse;

    constructor(
        private route: ActivatedRoute,
        private videoWebService: VideoWebService,
        private errorService: ErrorService,
        private logger: Logger
    ) {
        this.loadingData = true;
    }

    ngOnInit() {
        this.getConference();
    }

    getConference(): void {
        const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.videoWebService.getConferenceById(conferenceId).subscribe(
            (data: ConferenceResponse) => {
                this.loadingData = false;
                this.conference = data;
            },
            error => {
                this.loadingData = false;
                if (!this.errorService.returnHomeIfUnauthorised(error)) {
                    this.errorService.handleApiError(error);
                }
            }
        );
    }

    private buildBasicEventRequest(): ConferenceEventRequest {
        return new ConferenceEventRequest({
            time_stamp_utc: new Date(new Date().toUTCString()),
            conference_id: this.conference.id,
            event_id: Guid.create().toString()
        });
    }

    pauseHearing() {
        const request = this.buildBasicEventRequest();
        request.event_type = EventType.Pause;
        request.participant_id = this.conference.participants.find(x => x.role === 'Judge').id;
        this.sendEvent(request);
    }

    endHearing() {
        const request = this.buildBasicEventRequest();
        request.event_type = EventType.Close;
        request.participant_id = this.conference.participants.find(x => x.role === 'Judge').id;
        this.sendEvent(request);
    }

    joinHearing(participant: ParticipantResponse) {
        const request = this.buildBasicEventRequest();
        request.participant_id = participant.id;
        request.event_type = EventType.Joined;
        this.sendEvent(request);
    }

    leaveHearing(participant: ParticipantResponse) {
        const request = this.buildBasicEventRequest();
        request.participant_id = participant.id;
        request.event_type = EventType.Leave;
        this.sendEvent(request);
    }

    disconnectFromHearing(participant: ParticipantResponse) {
        const request = this.buildBasicEventRequest();
        request.participant_id = participant.id;
        request.event_type = EventType.Disconnected;
        this.sendEvent(request);
    }

    requestHelp(participant: ParticipantResponse) {
        const request = this.buildBasicEventRequest();
        request.participant_id = participant.id;
        request.event_type = EventType.Help;
        this.sendEvent(request);
    }

    transferToWaitingRoom(participant: ParticipantResponse) {
        const request = this.buildBasicEventRequest();
        request.participant_id = participant.id;
        request.event_type = EventType.Transfer;
        request.transfer_from = RoomType.HearingRoom;
        request.transfer_to = RoomType.WaitingRoom;
        this.sendEvent(request);
    }

    transferToHearingRoomFromConsultationRoom(participant: ParticipantResponse) {
        const request = this.buildBasicEventRequest();
        request.participant_id = participant.id;
        request.event_type = EventType.Transfer;
        request.transfer_from = RoomType.ConsultationRoom1;
        request.transfer_to = RoomType.WaitingRoom;
        this.sendEvent(request);
    }

    transferToHearingRoom(participant: ParticipantResponse) {
        const request = this.buildBasicEventRequest();
        request.participant_id = participant.id;
        request.event_type = EventType.Transfer;
        request.transfer_from = RoomType.WaitingRoom;
        request.transfer_to = RoomType.HearingRoom;
        this.sendEvent(request);
    }

    transferToConsultationRoom1(participant: ParticipantResponse) {
        const request = this.buildBasicEventRequest();
        request.participant_id = participant.id;
        request.event_type = EventType.Transfer;
        request.transfer_from = RoomType.WaitingRoom;
        request.transfer_to = RoomType.ConsultationRoom1;
        this.sendEvent(request);
    }

    transferToConsultationRoom2(participant: ParticipantResponse) {
        const request = this.buildBasicEventRequest();
        request.participant_id = participant.id;
        request.event_type = EventType.Transfer;
        request.transfer_from = RoomType.WaitingRoom;
        request.transfer_to = RoomType.ConsultationRoom2;
        this.sendEvent(request);
    }

    vhoConsultation(participant: ParticipantResponse) {
        const request = this.buildBasicEventRequest();
        request.participant_id = participant.id;
        request.event_type = EventType.VhoCall;
        request.transfer_to = RoomType.ConsultationRoom2;
        this.sendEvent(request);
    }

    private sendEvent(request: ConferenceEventRequest) {
        this.videoWebService.sendEvent(request).subscribe(
            () => {
                this.logger.event('Raised video event on test page', request);
            },
            error => {
                this.logger.error('Failed to raise video event on test page', error);
            }
        );
    }
}
