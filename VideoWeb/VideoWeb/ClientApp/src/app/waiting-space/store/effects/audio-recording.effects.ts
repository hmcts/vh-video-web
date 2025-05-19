import { Injectable } from '@angular/core';
import { createEffect, ofType, Actions } from '@ngrx/effects';
import { EMPTY, from } from 'rxjs';
import { map, tap, filter } from 'rxjs/operators';
import { Logger } from 'src/app/services/logging/logger-base';
import { AudioRecordingActions } from '../actions/audio-recording.actions';
import { AudioRecordingService } from 'src/app/services/audio-recording.service';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { ConferenceState } from '../reducers/conference.reducer';
import { getActiveConference, getAudioRecordingState } from '../selectors/conference.selectors';
import { ConferenceStatus } from 'src/app/services/clients/api-client';

@Injectable()
export class AudioRecordingEffects {
    private readonly loggerPrefix = '[AudioRecordingEffects] -';

    pauseAudioRecording$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(AudioRecordingActions.pauseAudioRecording),
                concatLatestFrom(() => [this.store.select(getAudioRecordingState)]),
                filter(([_, audioRecording]) => !audioRecording.recordingPaused && audioRecording.wowzaConnected),
                tap(_ =>
                    from(this.audioRecordingService.stopRecording()).pipe(
                        map(() => {
                            this.logger.info(`${this.loggerPrefix} Audio recording paused requested`);
                            return EMPTY;
                        })
                    )
                )
            ),
        { dispatch: false }
    );

    resumeAudioRecording$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(AudioRecordingActions.resumeAudioRecording),
                concatLatestFrom(() => [this.store.select(getAudioRecordingState), this.store.select(getActiveConference)]),
                filter(
                    ([_, audioRecording, conference]) =>
                        conference.status === ConferenceStatus.InSession && audioRecording.recordingPaused && !audioRecording.wowzaConnected
                ),
                tap(() => this.audioRecordingService.reconnectToWowza(null))
            ),
        { dispatch: false }
    );

    constructor(
        private actions$: Actions,
        private store: Store<ConferenceState>,
        private audioRecordingService: AudioRecordingService,
        private logger: Logger
    ) {}
}
