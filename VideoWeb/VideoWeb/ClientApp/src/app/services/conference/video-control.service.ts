import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter, map, retryWhen, take, tap, timeout } from 'rxjs/operators';
import { ParticipantModel } from 'src/app/shared/models/participant';
import { ParticipantUpdated } from 'src/app/waiting-space/models/video-call-models';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { LoggerService } from '../logging/logger.service';
import { ConferenceService } from './conference.service';
import { VirtualMeetingRoomModel } from './models/virtual-meeting-room.model';
import { VideoControlCacheService } from './video-control-cache.service';

@Injectable({
    providedIn: 'root'
})
export class VideoControlService {
    private loggerPrefix = '[VideoControlService] -';

    constructor(
        private conferenceService: ConferenceService,
        private videoCallService: VideoCallService,
        private videoControlCacheService: VideoControlCacheService,
        private logger: LoggerService
    ) {}

    private onParticipantsSpotlightStatusChangedSubject: Subject<boolean>;
    get onParticipantsSpotlightStatusChanged$(): Observable<boolean> {
        return this.onParticipantsSpotlightStatusChangedSubject.asObservable();
    }

    setSpotlightStatus(
        participantOrVmr: ParticipantModel | VirtualMeetingRoomModel,
        spotlightStatus: boolean,
        responseTimeoutInMS: number = 0
    ): Observable<ParticipantUpdated> {
        const conferenceId = this.conferenceService.currentConferenceId;

        this.logger.info(
            `${this.loggerPrefix} Attempting to set spotlight status of participant in conference: ${participantOrVmr.id} in ${conferenceId}.`,
            {
                spotlightStatus: spotlightStatus,
                conferenceId: this.conferenceService.currentConferenceId,
                participantOrVmrId: participantOrVmr.id,
                pexipId: participantOrVmr.pexipId,
                responseTimeoutInMSForReturnedObservable: responseTimeoutInMS
            }
        );

        this.videoCallService.spotlightParticipant(
            participantOrVmr.pexipId,
            spotlightStatus,
            this.conferenceService.currentConferenceId,
            participantOrVmr.id
        );

        this.logger.info(`${this.loggerPrefix} Attempted to make call to pexip to update spotlight status. Subscribing for update.`, {
            spotlightStatus: spotlightStatus,
            conferenceId: conferenceId,
            participantId: participantOrVmr.id
        });

        let onResponse$ = this.videoCallService.onParticipantUpdated().pipe(
            filter(update => update.pexipDisplayName.includes(participantOrVmr.id)),
            map(update => {
                if (update.isSpotlighted !== spotlightStatus) throw new Error('update.isSpotlighted !== spotlightStatus');
                return update;
            }),
            retryWhen(errors =>
                errors.pipe(
                    tap(() => {
                        this.logger.warn(`${this.loggerPrefix} Retrying call to pexip to update spotlight status.`, {
                            spotlightStatus: spotlightStatus,
                            conferenceId: conferenceId,
                            participantId: participantOrVmr.id
                        });

                        this.videoCallService.spotlightParticipant(
                            participantOrVmr.pexipId,
                            spotlightStatus,
                            this.conferenceService.currentConferenceId,
                            participantOrVmr.id
                        );
                    })
                )
            ),
            take(1)
        );

        onResponse$.subscribe(update => {
            this.logger.info(`${this.loggerPrefix} Update received. Attempting to update cache.`, {
                requestedValue: spotlightStatus,
                updatedValue: update.isSpotlighted,
                wasValueChangedPerRequest: spotlightStatus === update.isSpotlighted,
                conferenceId: conferenceId,
                participantId: participantOrVmr.id
            });

            this.videoControlCacheService.setSpotlightStatus(conferenceId, participantOrVmr.id, update.isSpotlighted);
        });

        if (responseTimeoutInMS > 0) {
            onResponse$ = onResponse$.pipe(timeout(responseTimeoutInMS));
        }

        return onResponse$;
    }

    isParticipantSpotlighted(participantId: string): boolean {
        return this.videoControlCacheService.getSpotlightStatus(this.conferenceService.currentConferenceId, participantId);
    }

    getSpotlightedParticipants(): string[] {
        var hearingControlState = this.videoControlCacheService.getStateForConference(this.conferenceService.currentConferenceId);

        const participantIds = [];
        for (var participantId in hearingControlState.participantStates) {
            if (hearingControlState.participantStates[participantId].isSpotlighted) participantIds.push(participantId);
        }

        return participantIds;
    }

    restoreParticipantSpotlightState(participantOrVmr: ParticipantModel | VirtualMeetingRoomModel) {
        const conferenceId = this.conferenceService.currentConferenceId;
        const isSpotlighted = this.videoControlCacheService.getSpotlightStatus(conferenceId, participantOrVmr.id);

        this.logger.info(`${this.loggerPrefix} restoring participant spotlight state.`, {
            participantOrVmrId: participantOrVmr.id,
            participantOrVmrDisplayName: participantOrVmr.displayName,
            spotlightState: isSpotlighted
        });

        this.setSpotlightStatus(participantOrVmr, isSpotlighted);
    }
}
