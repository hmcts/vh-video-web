import { Injectable } from '@angular/core';
import { ofType, createEffect, Actions } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Observable } from 'rxjs';
import { switchMap, map, filter } from 'rxjs/operators';
import {
    AddSelfTestFailureEventRequest,
    ApiClient,
    Role,
    SelfTestFailureReason,
    TestCallScoreResponse,
    TestScore
} from 'src/app/services/clients/api-client';
import * as ConferenceSelectors from '../selectors/conference.selectors';
import { SelfTestActions } from '../actions/self-test.actions';
import { Store } from '@ngrx/store';
import { ConferenceState } from '../reducers/conference.reducer';
import { Logger } from 'src/app/services/logging/logger-base';

@Injectable()
export class SelfTestEffects {
    retrieveSelfTestScore$ = createEffect(() =>
        this.actions$.pipe(
            ofType(SelfTestActions.retrieveSelfTestScore),
            switchMap(action => {
                let apiCall$: Observable<TestCallScoreResponse>;
                if (action.independent) {
                    this.logger.info(`${this.loggerPrefix} Retrieving self test score for independent test`, {
                        participant: action.participantId
                    });
                    apiCall$ = this.apiClient.getIndependentTestCallResult(action.participantId);
                } else {
                    this.logger.info(`${this.loggerPrefix} Retrieving self test score for test call`, {
                        participant: action.participantId
                    });
                    apiCall$ = this.apiClient.getTestCallResult(action.conferenceId, action.participantId);
                }
                return apiCall$.pipe(
                    map(score => SelfTestActions.retrieveSelfTestScoreSuccess({ score, participantId: action.participantId }))
                );
            })
        )
    );

    publishFailedSelfTestScore$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(SelfTestActions.retrieveSelfTestScoreSuccess),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getActiveConference),
                    this.store.select(ConferenceSelectors.getLoggedInParticipant)
                ]),
                filter(
                    ([action, conference, participant]) =>
                        !!conference && !!participant && participant.role !== Role.Judge && action.score.score === TestScore.Bad
                ),
                switchMap(([_action, conference, _participant]) => {
                    this.logger.info(`${this.loggerPrefix} Publishing self test bad score event for conference ${conference.id}`);
                    return this.apiClient.addSelfTestFailureEventToConference(
                        conference.id,
                        new AddSelfTestFailureEventRequest({
                            self_test_failure_reason: SelfTestFailureReason.BadScore
                        })
                    );
                })
            ),
        { dispatch: false }
    );

    publishSelfTestFailure$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(SelfTestActions.publishSelfTestFailure),
                concatLatestFrom(() => this.store.select(ConferenceSelectors.getActiveConference)),
                filter(([_action, conference]) => !!conference),
                switchMap(([action, conference]) => {
                    this.logger.info(`${this.loggerPrefix} Publishing self test failure event for conference ${conference.id}`, {
                        conference: conference.id,
                        reason: action.reason
                    });
                    return this.apiClient.addSelfTestFailureEventToConference(
                        conference.id,
                        new AddSelfTestFailureEventRequest({
                            self_test_failure_reason: action.reason
                        })
                    );
                })
            ),
        { dispatch: false }
    );

    private readonly loggerPrefix = '[SelfTestEffects] -';
    constructor(
        private actions$: Actions,
        private store: Store<ConferenceState>,
        private apiClient: ApiClient,
        private logger: Logger
    ) {}
}
