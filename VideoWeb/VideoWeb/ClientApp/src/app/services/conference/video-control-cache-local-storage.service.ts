import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { LoggerService } from '../logging/logger.service';
import { LocalStorageService } from './local-storage.service';
import {
    IHearingControlsState,
    IHearingControlStates,
    IVideoControlCacheStorageService
} from './video-control-cache-storage.service.interface';

@Injectable({
    providedIn: 'root'
})
export class VideoControlCacheLocalStorageService implements IVideoControlCacheStorageService {
    private loggerPrefix: string = '[VideoControlCacheLocalStorageService] -';

    constructor(private localStorageService: LocalStorageService, private logger: LoggerService) {}

    get localStorageKey() {
        return 'conferenceControlStates';
    }

    saveHearingStateForConference(conferenceId: string, hearingControlStates: IHearingControlsState) {
        this.logger.info(`${this.loggerPrefix} saving state for the conference`, {
            state: hearingControlStates
        });

        const state = this.localStorageService.load<IHearingControlStates>(this.localStorageKey) ?? {};
        state[conferenceId] = hearingControlStates;

        this.localStorageService.save(this.localStorageKey, state);
        return true;
    }

    loadHearingStateForConference(conferenceId: string): Observable<IHearingControlsState> {
        const state = this.localStorageService.load<IHearingControlStates>(this.localStorageKey) ?? {};

        this.logger.info(`${this.loggerPrefix} loading state for the conference`, {
            state: state
        });

        return of(state[conferenceId] ?? { participantStates: {} });
    }
}
