import { Injectable } from '@angular/core';
import { VideoWebService } from './api/video-web.service';
import { EventType, UpdateParticipantStatusEventRequest } from './clients/api-client';
import { Logger } from './logging/logger-base';
import { EventStatusModel } from './models/event-status.model';
import { SessionStorage } from './session-storage';

@Injectable({ providedIn: 'root' })
export class JudgeEventService {
    private readonly eventStatusCache: SessionStorage<EventStatusModel>;
    private readonly eventUnloadCache: SessionStorage<boolean>;
    private readonly JUDGE_STATUS_KEY = 'vh.judge.status';
    private readonly JUDGE_STATUS_UNLOAD_KEY = 'vh.judge.status.unload';

    constructor(private videoWebService: VideoWebService, private logger: Logger) {
        this.eventStatusCache = new SessionStorage(this.JUDGE_STATUS_KEY);
        this.eventUnloadCache = new SessionStorage(this.JUDGE_STATUS_UNLOAD_KEY);
    }

    private setJudgeEventDetails(conferenceId: string, participantId: string) {
        // to reset status on the navigation back to judge hearing list we need to know conference and participant Ids.
        this.eventStatusCache.set(new EventStatusModel(conferenceId, participantId));
    }

    public setJudgeUnload() {
        this.eventUnloadCache.set(true);
    }

    public clearJudgeUnload() {
        this.eventUnloadCache.clear();
    }

    public isUnload() {
        return this.eventUnloadCache.get();
    }

    public async raiseJudgeAvailableEvent(conferenceId: string, participantId: string) {
        this.setJudgeEventDetails(conferenceId, participantId);
        await this.sendEventAsync(conferenceId, participantId, EventType.JudgeAvailable);
    }

    public async raiseJudgeUnavailableEvent() {
        const eventStatusDetails = this.eventStatusCache.get();
        if (eventStatusDetails) {
            await this.sendEventAsync(eventStatusDetails.ConferenceId, eventStatusDetails.ParticipantId, EventType.JudgeUnavailable);
        }
    }

    private async sendEventAsync(conferenceId: string, participantId: string, eventType: EventType) {
        const request = new UpdateParticipantStatusEventRequest({
            participant_id: participantId,
            event_type: eventType
        });
        await this.videoWebService
            .raiseParticipantEvent(conferenceId, request)
            .toPromise()
            .then(x => {})
            .catch(error => {
                console.error(error);
            });
    }
}
