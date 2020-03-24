import { Injectable } from '@angular/core';
import { VideoWebService } from './api/video-web.service';
import { EventType, UpdateParticipantStatusEventRequest } from './clients/api-client';
import { Logger } from './logging/logger-base';

@Injectable({ providedIn: 'root' })
export class JudgeEventService {
    constructor(private videoWebService: VideoWebService, private logger: Logger) {}

    public async raiseJudgeAvailableEvent(conferenceId: string, participantId: string) {
        this.logger.debug(`Raising judge ${participantId} available event in conference ${conferenceId}`);
        try {
            await this.sendEventAsync(conferenceId, participantId, EventType.JudgeAvailable);
        } catch (error) {
            this.logger.error('Failed to raise Judge available event', error);
        }
    }

    public async raiseJudgeUnavailableEvent(conferenceId: string, participantId: string) {
        this.logger.debug(`Raising judge ${participantId} unavailable event in conference ${conferenceId}`);
        try {
            await this.sendEventAsync(conferenceId, participantId, EventType.JudgeUnavailable);
        } catch (error) {
            this.logger.error('Failed to raise Judge unavailable event', error);
        }
    }

    private async sendEventAsync(conferenceId: string, participantId: string, eventType: EventType) {
        const request = new UpdateParticipantStatusEventRequest({
            participant_id: participantId,
            event_type: eventType
        });
        await this.videoWebService.raiseParticipantEvent(conferenceId, request);
    }
}
