import { Injectable } from '@angular/core';
import { take } from 'rxjs/operators';
import { LoggerService } from '../logging/logger.service';
import { ConferenceService } from './conference.service';
import { DistributedVideoControlCacheService } from './distributed-video-control-cache.service';
import { IHearingControlsState } from './video-control-cache-storage.service.interface';

@Injectable({
    providedIn: 'root'
})
export class VideoControlCacheService {
    private loggerPrefix = '[VideoControlCacheService] -';
    private hearingControlStates: IHearingControlsState | null = { participantStates: {} };
    private conferenceId: string;

    initHearingControlState() {
        this.conferenceService.currentConference$.subscribe(conference => {
            if (!conference) {
                this.logger.warn(`${this.loggerPrefix} No conference loaded. Skipping loading of hearing state for conference`);
                return;
            }
            this.conferenceId = conference.id;
            this.storageService
                .loadHearingStateForConference(this.conferenceId)
                .pipe(take(1))
                .subscribe(state => {
                    this.hearingControlStates = state;
                    this.logger.info(`${this.loggerPrefix} initialised state for ${this.conferenceId}.`, {
                        hearingControlStates: this.hearingControlStates
                    });
                });
        });
    }

    constructor(
        private conferenceService: ConferenceService,
        private storageService: DistributedVideoControlCacheService,
        private logger: LoggerService
    ) {
        this.initHearingControlState();
    }

    setSpotlightStatus(participantId: string, spotlightValue: boolean, syncChanges: boolean = true) {
        this.logger.info(`${this.loggerPrefix} Setting spotlight status.`, {
            participantId: participantId,
            oldValue: this.hearingControlStates?.participantStates[participantId]?.isSpotlighted ?? null,
            newValue: spotlightValue
        });

        if (!this.hearingControlStates?.participantStates) {
            this.logger.warn(`${this.loggerPrefix} Cannot set spotlight status as hearing control states is not initialised.`);
            return;
        }

        if (!this.hearingControlStates.participantStates[participantId]) {
            this.hearingControlStates.participantStates[participantId] = { isSpotlighted: spotlightValue };
        } else {
            this.hearingControlStates.participantStates[participantId].isSpotlighted = spotlightValue;
        }

        if (syncChanges) {
            this.savingHearingState();
        }
    }

    getSpotlightStatus(participantId: string): boolean {
        this.logger.info(`${this.loggerPrefix} Getting spotlight status.`, {
            participantId: participantId,
            value: this.hearingControlStates?.participantStates[participantId]?.isSpotlighted ?? null
        });
        return this.hearingControlStates?.participantStates[participantId]?.isSpotlighted ?? false;
    }

    setRemoteMutedStatus(participantId: string, isRemoteMutedValue: boolean, syncChanges: boolean = true) {
        this.logger.info(`${this.loggerPrefix} Setting Remote Mute status.`, {
            participantId: participantId,
            oldValue: this.hearingControlStates?.participantStates[participantId]?.isRemoteMuted ?? null,
            newValue: isRemoteMutedValue
        });

        if (!this.hearingControlStates?.participantStates) {
            this.logger.warn(`${this.loggerPrefix} Cannot set Remote Mute status as hearing control states is not initialised.`);
            return;
        }

        if (!this.hearingControlStates.participantStates[participantId]) {
            this.hearingControlStates.participantStates[participantId] = { isRemoteMuted: isRemoteMutedValue };
        } else {
            this.hearingControlStates.participantStates[participantId].isRemoteMuted = isRemoteMutedValue;
        }

        if (syncChanges) {
            this.savingHearingState();
        }
    }

    getRemoteMutedStatus(participantId: string): boolean {
        this.logger.info(`${this.loggerPrefix} Getting Remote Mute status.`, {
            participantId: participantId,
            value: this.hearingControlStates?.participantStates[participantId]?.isRemoteMuted ?? null
        });
        return this.hearingControlStates?.participantStates[participantId]?.isRemoteMuted ?? false;
    }

    async setHandRaiseStatus(participantId: string, isHandRaisedValue: boolean, syncChanges: boolean = true) {
        this.logger.info(`${this.loggerPrefix} Setting Hand raise status.`, {
            participantId: participantId,
            oldValue: this.hearingControlStates?.participantStates[participantId]?.isHandRaised ?? null,
            newValue: isHandRaisedValue,
            states: this.hearingControlStates?.participantStates[participantId]
        });

        if (!this.hearingControlStates?.participantStates) {
            this.logger.warn(`${this.loggerPrefix} Cannot set hand raise status as hearing control states is not initialised.`);
            return;
        }
        const self = this;
        this.storageService
            .loadHearingStateForConference(this.conferenceId)
            .pipe(take(1))
            .toPromise()
            .then(state => {
                self.hearingControlStates = state;
                self.logger.info(`${this.loggerPrefix} re-initialised state for ${this.conferenceId}.`, {
                    hearingControlStates: this.hearingControlStates
                });
                setHandRaiseStatusInCache();
            })
            .catch(() => {
                self.logger.info(
                    `${this.loggerPrefix} failed to re-initialised state for ${this.conferenceId}.
                Control States may be out of sync`,
                    {
                        hearingControlStates: this.hearingControlStates
                    }
                );
                setHandRaiseStatusInCache();
            });
        const setHandRaiseStatusInCache = () => {
            if (!self.hearingControlStates.participantStates[participantId]) {
                self.hearingControlStates.participantStates[participantId] = { isHandRaised: isHandRaisedValue };
            } else {
                self.hearingControlStates.participantStates[participantId].isHandRaised = isHandRaisedValue;
            }
            if (syncChanges) {
                self.savingHearingState();
            }
        };
    }

    getHandRaiseStatus(participantId: string): boolean {
        this.logger.info(`${this.loggerPrefix} Getting hand raise status.`, {
            participantId: participantId,
            value: this.hearingControlStates?.participantStates[participantId]?.isHandRaised ?? null
        });
        return this.hearingControlStates?.participantStates[participantId]?.isHandRaised ?? false;
    }

    setLocalAudioMuted(participantId: string, localAudioMuted: boolean, syncChanges: boolean = true) {
        this.logger.info(`${this.loggerPrefix} Setting local audio muted.`, {
            participantId: participantId,
            oldValue: this.hearingControlStates?.participantStates[participantId]?.isLocalAudioMuted ?? null,
            newValue: localAudioMuted
        });

        if (!this.hearingControlStates?.participantStates) {
            this.logger.warn(`${this.loggerPrefix} Cannot set local audio muted as hearing control states is not initialised.`);
            return;
        }

        if (!this.hearingControlStates.participantStates[participantId]) {
            this.hearingControlStates.participantStates[participantId] = { isLocalAudioMuted: localAudioMuted };
        } else {
            this.hearingControlStates.participantStates[participantId].isLocalAudioMuted = localAudioMuted;
        }

        if (syncChanges) {
            this.storageService
                .saveHearingStateForConference(this.conferenceService.currentConferenceId, this.hearingControlStates)
                .subscribe();
        }
    }

    getLocalAudioMuted(participantId: string): boolean {
        this.logger.info(`${this.loggerPrefix} Getting local audio muted.`, {
            participantId: participantId,
            value: this.hearingControlStates?.participantStates[participantId]?.isLocalAudioMuted ?? null
        });
        return this.hearingControlStates?.participantStates[participantId]?.isLocalAudioMuted ?? false;
    }

    setLocalVideoMuted(participantId: string, localVideoMuted: boolean, syncChanges: boolean = true) {
        this.logger.info(`${this.loggerPrefix} Setting local video muted.`, {
            participantId: participantId,
            oldValue: this.hearingControlStates?.participantStates[participantId]?.isLocalVideoMuted ?? null,
            newValue: localVideoMuted
        });

        if (!this.hearingControlStates?.participantStates) {
            this.logger.warn(`${this.loggerPrefix} Cannot local video muted as hearing control states is not initialised.`);
            return;
        }

        if (!this.hearingControlStates.participantStates[participantId]) {
            this.hearingControlStates.participantStates[participantId] = { isLocalVideoMuted: localVideoMuted };
        } else {
            this.hearingControlStates.participantStates[participantId].isLocalVideoMuted = localVideoMuted;
        }

        if (syncChanges) {
            this.savingHearingState();
        }
    }

    getLocalVideoMuted(participantId: string): boolean {
        this.logger.info(`${this.loggerPrefix} Getting local video muted.`, {
            participantId: participantId,
            value: this.hearingControlStates?.participantStates[participantId]?.isLocalVideoMuted ?? null
        });
        return this.hearingControlStates?.participantStates[participantId]?.isLocalVideoMuted ?? false;
    }

    private savingHearingState() {
        this.storageService
            .saveHearingStateForConference(this.conferenceService.currentConferenceId, this.hearingControlStates)
            .subscribe();
    }
}
