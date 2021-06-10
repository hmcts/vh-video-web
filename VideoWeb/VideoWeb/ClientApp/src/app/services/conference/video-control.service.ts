import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { Logger } from '../logging/logger-base';
import { ConferenceService } from './conference.service';
import { ParticipantService } from './participant.service';
import { VideoControlCacheService } from './video-control-cache.service';

@Injectable({
    providedIn: 'root'
})
export class VideoControlService {
    constructor(
        private conferenceService: ConferenceService,
        private participantService: ParticipantService,
        private videoCallService: VideoCallService,
        private videoControlCacheService: VideoControlCacheService,
        private logger: Logger
    ) {}

    private onParticipantsSpotlightStatusChangedSubject: Subject<boolean>;
    get onParticipantsSpotlightStatusChanged$(): Observable<boolean> {
        return this.onParticipantsSpotlightStatusChangedSubject.asObservable();
    }

    spotlightParticipant(participantId: string) {
        const pexipId = this.participantService.getPexipIdForParticipant(participantId);
        const conferenceId = this.conferenceService.currentConference.id;
        this.videoCallService.spotlightParticipant(pexipId, true, conferenceId, participantId);
        this.videoControlCacheService.setSpotlightStatus(conferenceId, participantId, true);
    }

    isParticipantSpotlighted(participantId: string): boolean {
        return this.videoControlCacheService.getSpotlightStatus(this.conferenceService.currentConference.id, participantId);
    }

    getSpotlightedParticipants(): string[] {
        var hearingControlState = this.videoControlCacheService.getStateForConference(this.conferenceService.currentConference.id);

        const participantIds = [];
        for (var participantId in hearingControlState.participantState) {
            if (hearingControlState.participantState[participantId].isSpotlighted) participantIds.push(participantId);
        }

        return participantIds;
    }
}
