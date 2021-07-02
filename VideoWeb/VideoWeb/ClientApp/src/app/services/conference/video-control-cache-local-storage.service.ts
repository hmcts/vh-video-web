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
    constructor(private localStorageService: LocalStorageService, private logger: LoggerService) {
        this.logger.info('');
    }

    get localStorageKey() {
        return 'conferenceControlStates';
    }

    saveHearingStateForConference(conferenceId: string, hearingControlStates: IHearingControlsState) {
        const state = this.localStorageService.load<IHearingControlStates>(this.localStorageKey) ?? {};
        state[conferenceId] = hearingControlStates;

        this.localStorageService.save(this.localStorageKey, state);
        return true;
    }

    loadHearingStateForConference(conferenceId: string): Observable<IHearingControlsState> {
        const state = this.localStorageService.load<IHearingControlStates>(this.localStorageKey) ?? {};
        return of(state[conferenceId] ?? { participantStates: {} });
    }
}
