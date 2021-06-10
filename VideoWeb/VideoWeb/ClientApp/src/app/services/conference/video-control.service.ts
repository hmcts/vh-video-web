import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { Logger } from '../logging/logger-base';
import { ConferenceService } from './conference.service';
import { ParticipantService } from './participant.service';

@Injectable({
    providedIn: 'root'
})
export class VideoControlCacheService {
    setSpotlightStatus(conferenceId: string, participantId: string, spotlightValue: boolean) {
        throw new Error('Not Implemented');
    }
}

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

    isParticipantSpotlighted(participantId: string) {
        throw Error('Not implemented');
    }

    getSpotlightedParticipants(): Observable<string[]> {
        throw Error('Not implemented');
    }
}
