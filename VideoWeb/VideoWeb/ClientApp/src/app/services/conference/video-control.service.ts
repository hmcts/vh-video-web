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
        this.setSpotlightStatusById(participantOrVmr.id, participantOrVmr.pexipId, spotlightStatus);
    }

    setSpotlightStatusById(id: string, pexipId: string, spotlightStatus: boolean) {
        const conferenceId = this.conferenceService.currentConferenceId;

        this.logger.info(
            `${this.loggerPrefix} Attempting to set spotlight status of participant in conference: ${id} in ${conferenceId}.`,
            {
                spotlightStatus: spotlightStatus,
                conferenceId: this.conferenceService.currentConferenceId,
                participantOrVmrId: id,
                pexipId: pexipId
            }
        );

        this.videoCallService.spotlightParticipant(pexipId, spotlightStatus, this.conferenceService.currentConferenceId, id);

        this.logger.info(`${this.loggerPrefix} Attempted to make call to pexip to update spotlight status. Subscribing for update.`, {
            spotlightStatus: spotlightStatus,
            conferenceId: conferenceId,
            participantId: id
        });

        this.videoCallService
            .onParticipantUpdated()
            .pipe(
                filter(update => update.pexipDisplayName.includes(id)),
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
                                participantId: id
                            });

                            this.videoCallService.spotlightParticipant(
                                pexipId,
                                spotlightStatus,
                                this.conferenceService.currentConferenceId,
                                id
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
                    participantId: id
                });

                this.videoControlCacheService.setSpotlightStatus(id, update.isSpotlighted);
            });
    }

    isParticipantSpotlighted(participantId: string): boolean {
        return this.videoControlCacheService.getSpotlightStatus(participantId);
    }

    restoreParticipantsSpotlight(participantOrVmr: ParticipantModel | VirtualMeetingRoomModel) {
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

    setLocalAudioMutedById(id: string, localAudioMuted: boolean) {
        this.logger.info(`${this.loggerPrefix} Attempting to set local audio mute status of participant/vmr with ID ${id}.`, {
            localAudioMuted: localAudioMuted,
            participantOrVmrId: id
        });
        this.videoControlCacheService.setLocalAudioMuted(id, localAudioMuted);
    }

    getLocalAudioMutedById(id: string): boolean {
        this.logger.info(`${this.loggerPrefix} Attempting to get local audio mute status of participant/vmr with ID ${id}.`, {
            participantOrVmrId: id
        });
        return this.videoControlCacheService.getLocalAudioMuted(id);
    }

    setRemoteMuteStatusById(id: string, pexipId: string, remoteMuteStatus: boolean) {
        const conferenceId = this.conferenceService.currentConferenceId;

        this.logger.info(
            `${this.loggerPrefix} Attempting to set remote mute status of participant in conference: ${id} in ${conferenceId}.`,
            {
                remoteMuteStatus: remoteMuteStatus,
                conferenceId: this.conferenceService.currentConferenceId,
                participantOrVmrId: id,
                pexipId: pexipId
            }
        );

        this.videoCallService.muteParticipant(pexipId, remoteMuteStatus, this.conferenceService.currentConferenceId, id);

        this.logger.info(`${this.loggerPrefix} Attempted to make call to pexip to update remote mute status. Subscribing for update.`, {
            remoteMuteStatus: remoteMuteStatus,
            conferenceId: conferenceId,
            participantId: id
        });

        this.videoCallService
            .onParticipantUpdated()
            .pipe(
                filter(update => update.pexipDisplayName.includes(id)),
                map(update => {
                    if (update.isRemoteMuted !== remoteMuteStatus) {
                        throw new Error('update.isRemoteMuted !== remoteMuteStatus');
                    }
                    return update;
                }),
                retryWhen(errors =>
                    errors.pipe(
                        delay(200),
                        tap(() => {
                            this.logger.warn(`${this.loggerPrefix} Retrying call to pexip to update remote mute status.`, {
                                spotlightStatus: remoteMuteStatus,
                                conferenceId: conferenceId,
                                participantId: id
                            });

                            this.videoCallService.muteParticipant(
                                pexipId,
                                remoteMuteStatus,
                                this.conferenceService.currentConferenceId,
                                id
                            );
                        })
                    )
                ),
                take(1)
            )
            .subscribe(update => {
                this.logger.info(`${this.loggerPrefix} Update received. Attempting to update cache.`, {
                    requestedValue: remoteMuteStatus,
                    updatedValue: update.isRemoteMuted,
                    wasValueChangedPerRequest: remoteMuteStatus === update.isRemoteMuted,
                    conferenceId: conferenceId,
                    participantId: id
                });

                this.videoControlCacheService.setRemoteMutedStatus(id, update.isRemoteMuted);
            });
    }

    getRemoteMutedById(id: string): boolean {
        this.logger.info(`${this.loggerPrefix} Attempting to get remote mute status of participant/vmr with ID ${id}.`, {
            participantOrVmrId: id
        });
        return this.videoControlCacheService.getRemoteMutedStatus(id);
    }

    setLocalVideoMutedById(id: string, localVideoMuted: boolean) {
        this.logger.info(`${this.loggerPrefix} Attempting to set local video mute status of participant/vmr with ID ${id}.`, {
            localVideoMuted: localVideoMuted,
            participantOrVmrId: id
        });
        this.videoControlCacheService.setLocalVideoMuted(id, localVideoMuted);
    }

    getLocalVideoMutedById(id: string): boolean {
        this.logger.info(`${this.loggerPrefix} Attempting to get local video mute status of participant/vmr with ID ${id}.`, {
            participantOrVmrId: id
        });
        return this.videoControlCacheService.getLocalVideoMuted(id);
    }
}
