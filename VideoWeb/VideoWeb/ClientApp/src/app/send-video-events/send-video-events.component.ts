import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Guid } from 'guid-typescript';
import { ConferenceEventRequest, ConferenceResponse, EventType, ParticipantResponse, RoomType } from '../services/clients/api-client';
import { VideoWebService } from '../services/api/video-web.service';
import { ErrorService } from '../services/error.service';
import { Logger } from '../services/logging/logger-base';

@Component({
    selector: 'app-send-video-events',
    templateUrl: './send-video-events.component.html'
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

    async getConference(): Promise<void> {
        const conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        try {
            this.conference = await this.videoWebService.getConferenceById(conferenceId);
        } catch (error) {
            if (!this.errorService.returnHomeIfUnauthorised(error)) {
                this.errorService.handleApiError(error);
            }
        } finally {
            this.loadingData = false;
        }
    }

    private buildBasicEventRequest(): ConferenceEventRequest {
        return new ConferenceEventRequest({
            time_stamp_utc: new Date(new Date().toUTCString()),
            conference_id: this.conference.id,
            event_id: Guid.create().toString()
        });
    }

    suspendHearing() {
        const request = this.buildBasicEventRequest();
        request.event_type = EventType.Suspend;
        this.sendEvent(request);
    }

    pauseHearing() {
        const request = this.buildBasicEventRequest();
        request.event_type = EventType.Pause;
        this.sendEvent(request);
    }

    endHearing() {
        const request = this.buildBasicEventRequest();
        request.event_type = EventType.Close;
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

    private async sendEvent(request: ConferenceEventRequest) {
        try {
            await this.videoWebService.sendEvent(request);
        } catch (error) {
            this.logger.error('Failed to raise video event on test page', error);
        }
    }
}
