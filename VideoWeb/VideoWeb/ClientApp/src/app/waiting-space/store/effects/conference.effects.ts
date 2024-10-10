import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { of } from 'rxjs';
import { catchError, switchMap, map, tap, filter } from 'rxjs/operators';
import { ApiClient, ParticipantStatus, UpdateParticipantDisplayNameRequest } from 'src/app/services/clients/api-client';
import { ConferenceActions } from '../actions/conference.actions';
import { mapConferenceToVHConference } from '../models/api-contract-to-state-model-mappers';
import { ConferenceState } from '../reducers/conference.reducer';
import { Store } from '@ngrx/store';
import * as ConferenceSelectors from '../selectors/conference.selectors';
import { SupplierClientService } from 'src/app/services/api/supplier-client.service';
import { VideoCallService } from '../../services/video-call.service';
import { ErrorService } from 'src/app/services/error.service';

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

    loadLoggedInParticipant$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ConferenceActions.loadLoggedInParticipant),
            switchMap(action =>
                this.store.select(ConferenceSelectors.getParticipants).pipe(
                    map(participants => participants.filter(p => p.id === action.participantId)),
                    map(participant => ConferenceActions.loadLoggedInParticipantSuccess({ participant: participant[0] }))
                )
            )
        )
    );

    loadConferenceSuccess$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.loadConferenceSuccess),
                tap(action => {
                    this.supplierClientService.loadSupplierScript(action.conference.supplier);
                })
            ),
        { dispatch: false }
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

    participantLeaveHearingRoom$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ConferenceActions.participantLeaveHearingRoom),
            concatLatestFrom(() => [this.store.select(ConferenceSelectors.getLoggedInParticipant)]),
            switchMap(([action, participant]) =>
                this.apiClient.nonHostLeaveHearing(action.conferenceId).pipe(
                    map(() => ConferenceActions.participantLeaveHearingRoomSuccess({ conferenceId: action.conferenceId, participant })),
                    catchError(error => of(ConferenceActions.participantLeaveHearingRoomFailure({ error })))
                )
            )
        )
    );

    participantDisconnect$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.updateParticipantStatus),
                filter(action => action.status === ParticipantStatus.Disconnected),
                concatLatestFrom(() => [this.store.select(ConferenceSelectors.getLoggedInParticipant)]),
                switchMap(([action, participant]) => {
                    if (participant.id !== action.participantId) {
                        return of();
                    }
                    const callTag = participant?.pexipInfo?.callTag ?? this.videoCallService.pexipAPI.call_tag;
                    if (action.reason.includes(`connected on another device ${callTag}`)) {
                        this.errorService.goToServiceError(
                            'error-service.unexpected-error',
                            'error-service.connected-another-device',
                            false
                        );
                    }
                    return of();
                })
            ),
        { dispatch: false }
    );

    constructor(
        private actions$: Actions,
        private store: Store<ConferenceState>,
        private apiClient: ApiClient,
        private supplierClientService: SupplierClientService,
        private videoCallService: VideoCallService,
        private errorService: ErrorService
    ) {}
}
