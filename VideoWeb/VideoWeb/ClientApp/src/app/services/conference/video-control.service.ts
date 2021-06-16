import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter, take, timeout } from 'rxjs/operators';
import { ParticipantUpdated } from 'src/app/waiting-space/models/video-call-models';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { LoggerService } from '../logging/logger.service';
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
        private logger: LoggerService
    ) {}

    private onParticipantsSpotlightStatusChangedSubject: Subject<boolean>;
    get onParticipantsSpotlightStatusChanged$(): Observable<boolean> {
        return this.onParticipantsSpotlightStatusChangedSubject.asObservable();
    }

    setSpotlightStatus(
        conferenceId: string,
        participantId: string,
        spotlightStatus: boolean,
        responseTimeoutInMS: number = 0
    ): Observable<ParticipantUpdated> {
        this.logger.info(
            `${this.loggerPrefix} Attempting to set spotlight status of participant in conference: ${participantId} in ${conferenceId}.`,
            {
                spotlightStatus: spotlightStatus,
                conferenceId: conferenceId,
                participantId: participantId,
                responseTimeoutInMSForReturnedObservable: responseTimeoutInMS
            }
        );

        const pexipId = this.participantService.getPexipIdForParticipant(participantId);
        this.videoCallService.spotlightParticipant(pexipId, spotlightStatus, conferenceId, participantId);

        this.logger.info(`${this.loggerPrefix} Attempted to make pexip call. Subscribing for update.`, {
            spotlightStatus: spotlightStatus,
            conferenceId: conferenceId,
            participantId: participantId
        });

        let onResponse$ = this.videoCallService.onParticipantUpdated().pipe(
            filter(x => x.pexipDisplayName.includes(participantId)),
            take(1)
        );

        onResponse$.subscribe(updatedParticipant => {
            this.logger.info(`${this.loggerPrefix} Update received. Attempting to update cache.`, {
                requestedValue: spotlightStatus,
                updatedValue: updatedParticipant.isSpotlighted,
                wasValueChangedPerRequest: spotlightStatus === updatedParticipant.isSpotlighted,
                conferenceId: conferenceId,
                participantId: participantId
            });

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
        for (var participantId in hearingControlState.participantStates) {
            if (hearingControlState.participantStates[participantId].isSpotlighted) participantIds.push(participantId);
        }

        return participantIds;
    }
}
