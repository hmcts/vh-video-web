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

    createAudioMixes$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.createPexipParticipant),
                concatLatestFrom(action => [
                    this.store.select(ConferenceSelectors.getParticipantByPexipId(action.participant.uuid)),
                    this.store.select(ConferenceSelectors.getEndpointByPexipId(action.participant.uuid))
                ]),
                tap(([action, participant, endpoint]) => {
                    // get participant or endpoint where action.participant.uuid === participant.pexipId
                    if (!participant && !endpoint) {
                        return;
                    }

                    // TODO: check if participant.interpreterLanguage is not null or endpoint.interpreterLanguage is not null
                    const hasInterpretationLanguage = true;
                    if (!hasInterpretationLanguage) {
                        return;
                    }

                    // const languageDescription = null;
                    // if (!languageDescription){
                    //     return;
                    // }

                    const participantUuid = participant ? participant.pexipInfo.uuid : endpoint.pexipInfo.uuid;
                    const languageDescription = 'Spanish';
                    const audioMixes: PexipAudioMix[] = [
                        {
                            mix_name: 'main',
                            prominent: false
                        },
                        {
                            mix_name: languageDescription,
                            prominent: true
                        }
                    ];
                    this.videoCallService.receiveAudioFromMix(languageDescription, participantUuid);
                    if (participant && participant.hearingRole === HearingRole.INTERPRETER) {
                        this.videoCallService.sendParticipantAudioToMixes(audioMixes, participantUuid);
                    }
                })
            ),
        { dispatch: false }
    );

    constructor(
        private actions$: Actions,
        private apiClient: ApiClient,
        private store: Store<ConferenceState>,
        private videoCallService: VideoCallService
    ) {}
}
