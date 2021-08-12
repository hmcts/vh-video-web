import { Injectable } from '@angular/core';
import { take } from 'rxjs/operators';
import { LoggerService } from '../logging/logger.service';
import { ConferenceService } from './conference.service';
import { VideoControlCacheLocalStorageService } from './video-control-cache-local-storage.service';
import { IHearingControlsState } from './video-control-cache-storage.service.interface';

@Injectable({
    providedIn: 'root'
})
export class VideoControlCacheService {
    private loggerPrefix = '[VideoControlCacheService] -';

    private hearingControlStates: IHearingControlsState | null = null;

    constructor(
        private conferenceService: ConferenceService,
        private storageService: VideoControlCacheLocalStorageService,
        private logger: LoggerService
    ) {
        this.conferenceService.currentConference$.subscribe(conference => {
            if (!conference) {
                this.logger.warn(`${this.loggerPrefix} No conference loaded. Skipping loading of hearing state for conference`);
                return;
            }

            this.storageService
                .loadHearingStateForConference(conference.id)
                .pipe(take(1))
                .subscribe(state => {
                    this.hearingControlStates = state;
                });
        });
    }

    setSpotlightStatus(participantId: string, spotlightValue: boolean) {
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

        this.storageService.saveHearingStateForConference(this.conferenceService.currentConferenceId, this.hearingControlStates);
    }

    getSpotlightStatus(participantId: string): boolean {
        return this.hearingControlStates?.participantStates[participantId]?.isSpotlighted ?? false;
    }
}
