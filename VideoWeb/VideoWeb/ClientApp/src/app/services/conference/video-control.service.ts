import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter, take, timeout } from 'rxjs/operators';
import { ParticipantUpdated } from 'src/app/waiting-space/models/video-call-models';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { Logger } from '../logging/logger-base';
import { ParticipantService } from './participant.service';
import { VideoControlCacheService } from './video-control-cache.service';

@Injectable({
    providedIn: 'root'
})
export class VideoControlService {
    private loggerPrefix = '[VideoControlService] -';

    constructor(
        private participantService: ParticipantService,
        private videoCallService: VideoCallService,
        private videoControlCacheService: VideoControlCacheService,
        private logger: Logger
    ) {}

    private onParticipantsSpotlightStatusChangedSubject: Subject<boolean>;
    get onParticipantsSpotlightStatusChanged$(): Observable<boolean> {
        return this.onParticipantsSpotlightStatusChangedSubject.asObservable();
    }

    setSpotlightStatus(
        conferenceId: string,
        participantId: string,
        spotlightStatus: boolean,
        responseTimeoutInMS: number = 15000
    ): Observable<ParticipantUpdated> {
        this.logger.info(`${this.loggerPrefix} Attempting to spotlight participant in conference: ${participantId} in ${conferenceId}`);

        const pexipId = this.participantService.getPexipIdForParticipant(participantId);
        this.videoCallService.spotlightParticipant(pexipId, spotlightStatus, conferenceId, participantId);

        let onResponse$ = this.videoCallService.onParticipantUpdated().pipe(
            filter(x => x.pexipDisplayName.includes(participantId)),
            take(1)
        );

        onResponse$.subscribe(updatedParticipant => {
            this.videoControlCacheService.setSpotlightStatus(conferenceId, participantId, updatedParticipant.isSpotlighted);
        });

        if (responseTimeoutInMS > 0) {
            onResponse$ = onResponse$.pipe(timeout(responseTimeoutInMS));
        }

        return onResponse$;
    }

    isParticipantSpotlighted(conferenceId: string, participantId: string): boolean {
        return this.videoControlCacheService.getSpotlightStatus(conferenceId, participantId);
    }

    getSpotlightedParticipants(conferenceId: string): string[] {
        var hearingControlState = this.videoControlCacheService.getStateForConference(conferenceId);

        const participantIds = [];
        for (var participantId in hearingControlState.participantState) {
            if (hearingControlState.participantState[participantId].isSpotlighted) participantIds.push(participantId);
        }

        return participantIds;
    }
}
