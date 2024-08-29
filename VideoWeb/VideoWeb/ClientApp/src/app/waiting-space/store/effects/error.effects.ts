import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Logger } from 'src/app/services/logging/logger-base';
import { ReferenceActions } from '../actions/reference-data.actions';
import { ConferenceActions } from '../actions/conference.actions';
import { switchMap } from 'rxjs/operators';

@Injectable()
export class ErrorEffects {
    logAllErrors$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(
                    ReferenceActions.loadInterpreterLanguagesFailure,
                    ConferenceActions.loadConferenceFailure,
                    ConferenceActions.participantLeaveHearingRoomFailure
                ),
                switchMap(action => {
                    this.logger.error('Error occurred', action.error);
                    return [];
                })
            ),
        { dispatch: false }
    );

    constructor(
        private actions$: Actions,
        private logger: Logger
    ) {}
}
