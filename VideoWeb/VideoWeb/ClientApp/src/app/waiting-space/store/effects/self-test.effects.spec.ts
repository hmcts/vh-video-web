import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Observable, of } from 'rxjs';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { VHConference } from '../models/vh-conference';
import { ConferenceState } from '../reducers/conference.reducer';
import { mapConferenceToVHConference } from '../models/api-contract-to-state-model-mappers';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Logger } from 'src/app/services/logging/logger-base';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { SelfTestEffects } from './self-test.effects';
import { SelfTestActions } from '../actions/self-test.actions';
import { Guid } from 'guid-typescript';
import { cold, hot } from 'jasmine-marbles';
import {
    AddSelfTestFailureEventRequest,
    ApiClient,
    Role,
    SelfTestFailureReason,
    TestCallScoreResponse,
    TestScore
} from 'src/app/services/clients/api-client';
import * as ConferenceSelectors from '../selectors/conference.selectors';

describe('SelfTestEffects', () => {
    const testData = new ConferenceTestData();
    let vhConference: VHConference;

    let actions$: Observable<any>;
    let effects: SelfTestEffects;
    let apiClient: jasmine.SpyObj<ApiClient>;
    let mockConferenceStore: MockStore<ConferenceState>;

    beforeEach(() => {
        vhConference = mapConferenceToVHConference(testData.getConferenceDetailNow());
        apiClient = jasmine.createSpyObj<ApiClient>('ApiClient', [
            'getIndependentTestCallResult',
            'getTestCallResult',
            'addSelfTestFailureEventToConference'
        ]);

        TestBed.configureTestingModule({
            providers: [
                SelfTestEffects,
                provideMockStore(),
                provideMockActions(() => actions$),
                { provide: ApiClient, useValue: apiClient },
                { provide: Logger, useValue: new MockLogger() }
            ]
        });

        effects = TestBed.inject(SelfTestEffects);
        mockConferenceStore = TestBed.inject(MockStore);
    });

    describe('retrieveSelfTestScore$', () => {
        it('should retrieve self test score for independent test', () => {
            // Arrange
            const action = SelfTestActions.retrieveSelfTestScore({
                conferenceId: undefined,
                independent: true,
                participantId: Guid.create().toString()
            });
            const testCallResponse = new TestCallScoreResponse({
                passed: true,
                score: TestScore.Good
            });
            apiClient.getIndependentTestCallResult.and.returnValue(of(testCallResponse));

            // Act
            actions$ = hot('-a', { a: action });
            const expected = cold('-b', {
                b: SelfTestActions.retrieveSelfTestScoreSuccess({ score: testCallResponse, participantId: action.participantId })
            });

            // Assert
            expect(effects.retrieveSelfTestScore$).toBeObservable(expected);
        });

        it('should retrieve self test score for test call', () => {
            // Arrange
            const action = SelfTestActions.retrieveSelfTestScore({
                conferenceId: vhConference.id,
                independent: false,
                participantId: vhConference.participants[0].id
            });
            const testCallResponse = new TestCallScoreResponse({
                passed: false,
                score: TestScore.Bad
            });
            apiClient.getTestCallResult.and.returnValue(of(testCallResponse));

            // Act
            actions$ = hot('-a', { a: action });
            const expected = cold('-b', {
                b: SelfTestActions.retrieveSelfTestScoreSuccess({ score: testCallResponse, participantId: action.participantId })
            });

            // Assert
            expect(effects.retrieveSelfTestScore$).toBeObservable(expected);
        });
    });

    describe('publishFailedSelfTestScore$', () => {
        it('should publish a bad self test score for non judicial participants who failed as part of the journey', () => {
            // Arrange
            const participant = vhConference.participants.find(x => x.role !== Role.Judge);
            const action = SelfTestActions.retrieveSelfTestScoreSuccess({
                score: new TestCallScoreResponse({
                    passed: false,
                    score: TestScore.Bad
                }),
                participantId: participant.id
            });
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);

            apiClient.addSelfTestFailureEventToConference.and.returnValue(of(void 0));

            // Act
            actions$ = hot('-a', { a: action });

            // Assert
            effects.publishFailedSelfTestScore$.subscribe(() => {
                expect(apiClient.addSelfTestFailureEventToConference).toHaveBeenCalledWith(
                    vhConference.id,
                    jasmine.objectContaining({
                        self_test_failure_reason: SelfTestFailureReason.BadScore
                    })
                );
            });
        });
    });

    describe('publishSelfTestFailure$', () => {
        it('should publish self test failure event for conference', () => {
            // Arrange
            const action = SelfTestActions.publishSelfTestFailure({
                conferenceId: vhConference.id,
                reason: SelfTestFailureReason.IncompleteTest
            });
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);

            apiClient.addSelfTestFailureEventToConference.and.returnValue(of(void 0));

            // Act
            actions$ = hot('-a', { a: action });

            // Assert
            effects.publishSelfTestFailure$.subscribe(() => {
                expect(apiClient.addSelfTestFailureEventToConference).toHaveBeenCalledWith(
                    vhConference.id,
                    new AddSelfTestFailureEventRequest({
                        self_test_failure_reason: SelfTestFailureReason.IncompleteTest
                    })
                );
            });
        });
    });
});
