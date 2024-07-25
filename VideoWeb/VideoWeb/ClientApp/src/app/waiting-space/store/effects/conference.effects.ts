import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { NEVER, of } from 'rxjs';
import { catchError, switchMap, map, tap } from 'rxjs/operators';
import { ApiClient, UpdateParticipantDisplayNameRequest } from 'src/app/services/clients/api-client';
import { ConferenceActions } from '../actions/conference.actions';
import { mapConferenceToVHConference } from '../models/api-contract-to-state-model-mappers';
import { ConferenceState } from '../reducers/conference.reducer';
import * as ConferenceSelectors from '../selectors/conference.selectors';
import { Store } from '@ngrx/store';
import { VideoCallService } from '../../services/video-call.service';
import { HearingRole } from '../../models/hearing-role-model';

@Injectable()
export class ConferenceEffects {
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

    updateHostDisplayName$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ConferenceActions.updateJudgeDisplayName, ConferenceActions.updateStaffMemberDisplayName),
            switchMap(action =>
                this.apiClient
                    .updateParticipantDisplayName(
                        action.conferenceId,
                        action.participantId,
                        new UpdateParticipantDisplayNameRequest({ display_name: action.displayName })
                    )
                    .pipe(
                        map(() =>
                            ConferenceActions.updateParticipantDisplayNameSuccess({
                                conferenceId: action.conferenceId,
                                participantId: action.participantId,
                                displayName: action.displayName
                            })
                        )
                    )
            )
        )
    );

    constructor(
        private actions$: Actions,
        private apiClient: ApiClient
    ) {}
}
