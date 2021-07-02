import { Injectable } from '@angular/core';
import { delay, filter, map, retryWhen, take, tap } from 'rxjs/operators';
import { ParticipantModel } from 'src/app/shared/models/participant';
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

    setSpotlightStatus(participantOrVmr: ParticipantModel | VirtualMeetingRoomModel, spotlightStatus: boolean) {
        const conferenceId = this.conferenceService.currentConferenceId;

        this.logger.info(
            `${this.loggerPrefix} Attempting to set spotlight status of participant in conference: ${participantOrVmr.id} in ${conferenceId}.`,
            {
                spotlightStatus: spotlightStatus,
                conferenceId: this.conferenceService.currentConferenceId,
                participantOrVmrId: participantOrVmr.id,
                pexipId: participantOrVmr.pexipId
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

        this.videoCallService
            .onParticipantUpdated()
            .pipe(
                filter(update => update.pexipDisplayName.includes(participantOrVmr.id)),
                map(update => {
                    if (update.isSpotlighted !== spotlightStatus) {
                        throw new Error('update.isSpotlighted !== spotlightStatus');
                    }
                    return update;
                }),
                retryWhen(errors =>
                    errors.pipe(
                        delay(200),
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
            )
            .subscribe(update => {
                this.logger.info(`${this.loggerPrefix} Update received. Attempting to update cache.`, {
                    requestedValue: spotlightStatus,
                    updatedValue: update.isSpotlighted,
                    wasValueChangedPerRequest: spotlightStatus === update.isSpotlighted,
                    conferenceId: conferenceId,
                    participantId: participantOrVmr.id
                });

                this.videoControlCacheService.setSpotlightStatus(participantOrVmr.id, update.isSpotlighted);
            });
    }

    isParticipantSpotlighted(participantId: string): boolean {
        return this.videoControlCacheService.getSpotlightStatus(participantId);
    }

    restoreParticipantSpotlightState(participantOrVmr: ParticipantModel | VirtualMeetingRoomModel) {
        const isSpotlighted = this.videoControlCacheService.getSpotlightStatus(participantOrVmr.id);

        if (isSpotlighted) {
            this.logger.info(`${this.loggerPrefix} restoring participant spotlight state.`, {
                participantOrVmrId: participantOrVmr.id,
                participantOrVmrDisplayName: participantOrVmr.displayName,
                spotlightState: isSpotlighted
            });

            this.setSpotlightStatus(participantOrVmr, isSpotlighted);
        } else {
            this.logger.warn(`${this.loggerPrefix} NOT restoring participant spotlight state as they are not spotlighted.`, {
                participantOrVmrId: participantOrVmr.id,
                participantOrVmrDisplayName: participantOrVmr.displayName,
                spotlightState: isSpotlighted
            });
        }
    }
}
