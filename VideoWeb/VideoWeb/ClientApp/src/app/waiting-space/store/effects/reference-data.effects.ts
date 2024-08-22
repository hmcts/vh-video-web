import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, switchMap, map } from 'rxjs/operators';
import { ApiClient } from 'src/app/services/clients/api-client';
import { ReferenceActions } from '../actions/reference-data.actions';
import { mapInterpeterLanguageToVHInterpreterLanguage } from '../models/api-contract-to-state-model-mappers';

@Injectable()
export class ReferenceDataEffects {
    loadInterpreterLanguages$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ReferenceActions.loadInterpreterLanguages),
            switchMap(() =>
                this.apiClient.getAvailableInterpreterLanguages().pipe(
                    map(conference => {
                        const mappedLanguages = conference.map(mapInterpeterLanguageToVHInterpreterLanguage);
                        return ReferenceActions.loadInterpreterLanguagesSuccess({ languages: mappedLanguages });
                    }),
                    catchError(error => of(ReferenceActions.loadInterpreterLanguagesFailure({ error })))
                )
            )
        )
    );

    constructor(
        private actions$: Actions,
        private apiClient: ApiClient
    ) {}
}
