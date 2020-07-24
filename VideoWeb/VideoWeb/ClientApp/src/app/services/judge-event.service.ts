import { Injectable } from '@angular/core';
import { VideoWebService } from './api/video-web.service';
import { EventType, UpdateParticipantStatusEventRequest } from './clients/api-client';
import { Logger } from './logging/logger-base';

@Injectable({ providedIn: 'root' })
export class JudgeEventService {
    constructor(private videoWebService: VideoWebService, private logger: Logger) {}

    public async raiseJudgeAvailableEvent(conferenceId: string) {
        this.logger.debug(`Raising judge available event in conference ${conferenceId}`);
        try {
            await this.sendEventAsync(conferenceId, EventType.JudgeAvailable);
        } catch (error) {
            this.logger.error('Failed to raise Judge available event', error);
        }
    }

    public async raiseJudgeUnavailableEvent(conferenceId: string) {
        this.logger.debug(`Raising judge unavailable event in conference ${conferenceId}`);
        try {
            await this.sendEventAsync(conferenceId, EventType.JudgeUnavailable);
        } catch (error) {
            this.logger.error('Failed to raise Judge unavailable event', error);
        }
    }

    private async sendEventAsync(conferenceId: string, eventType: EventType) {
        const request = new UpdateParticipantStatusEventRequest({
            event_type: eventType
        });
        await this.videoWebService.raiseParticipantEvent(conferenceId, request);
    }
}
