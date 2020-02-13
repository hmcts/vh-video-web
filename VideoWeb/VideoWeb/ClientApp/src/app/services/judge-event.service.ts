import { Injectable } from '@angular/core';
import { UpdateParticipantStatusEventRequest, EventType } from './clients/api-client';
import { SessionStorage } from './session-storage';
import { EventStatusModel } from './models/event-status.model';
import { VideoWebService } from './api/video-web.service';
import { Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class JudgeEventService {
  private readonly eventStatusCache: SessionStorage<EventStatusModel>;
  private readonly JUDGE_STATUS_KEY = 'vh.judge.status';
  $eventSubscription: Subscription;

  constructor(private videoWebService: VideoWebService) {
    this.eventStatusCache = new SessionStorage(this.JUDGE_STATUS_KEY);
  }

  private setJudgeEventDetails(conferenceId: string, participantId: string) {
    // to reset status on the navigation back to judge hearing list we need to know conference and participant Ids.
    this.eventStatusCache.set(
      new EventStatusModel(conferenceId, participantId)
    );
  }

  public raiseJudgeAvailableEvent(conferenceId: string, participantId: string) {
    this.setJudgeEventDetails(conferenceId, participantId);
    this.sendEvent(conferenceId, participantId, EventType.JudgeAvailable);
  }

  public raiseJudgeUnavailableEvent() {
    const eventStatusDetails = this.eventStatusCache.get();
    if (eventStatusDetails) {
      this.sendEvent(eventStatusDetails.ConferenceId, eventStatusDetails.ParticipantId, EventType.JudgeUnavailable);
    }
  }

  private sendEvent(conferenceId: string, participantId: string, eventType: EventType) {
    this.$eventSubscription = this.videoWebService
      .raiseParticipantEvent(
        conferenceId,
        new UpdateParticipantStatusEventRequest({
          participant_id: participantId,
          event_type: eventType
        })
      )
      .subscribe(
        x => { },
        error => {
          console.error(error);
        }
      );
  }

  clearSubcriptions() {
    if (this.$eventSubscription) {
      this.$eventSubscription.unsubscribe();
    }
  }
}
