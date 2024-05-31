import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';
import { ApiClient } from 'src/app/services/clients/api-client';
import { ConferenceActions } from '../actions/conference.actions';
import { mapConferenceToVHConference } from '../models/api-contract-to-state-model-mappers';

@Injectable()
export class ConferenceEffectsEffects {
    loadConference$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ConferenceActions.loadConference),
            switchMap(action =>
                this.apiClient.getConferenceById(action.conferenceId).pipe(
                    map(conference => ConferenceActions.loadConferenceSuccess({ conference: mapConferenceToVHConference(conference) })),
                    catchError(error => of(ConferenceActions.loadConferenceFailure({ error })))
                )
            )
        )
    );

    constructor(
        private actions$: Actions,
        private apiClient: ApiClient
    ) {}
}
