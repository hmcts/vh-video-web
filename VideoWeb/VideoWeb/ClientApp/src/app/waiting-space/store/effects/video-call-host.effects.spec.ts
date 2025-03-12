import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ApiClient, Role } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { VideoCallService } from '../../services/video-call.service';
import { ConferenceState } from '../reducers/conference.reducer';
import { VideoCallHostEffects } from './video-call-host.effects';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { Logger } from 'src/app/services/logging/logger-base';
import { VideoCallHostActions } from '../actions/video-call-host.actions';
import * as ConferenceSelectors from '../selectors/conference.selectors';
import { mapConferenceToVHConference } from '../models/api-contract-to-state-model-mappers';
import { VHPexipParticipant } from '../models/vh-conference';
import { cold, getTestScheduler, hot } from 'jasmine-marbles';
import { ConferenceActions } from '../actions/conference.actions';
import { TransferDirection } from 'src/app/services/models/hearing-transfer';

describe('VideoCallHostEffects', () => {
    let actions$: Observable<any>;
    let effects: VideoCallHostEffects;
    let videoCallService: jasmine.SpyObj<VideoCallService>;

    let apiClient: jasmine.SpyObj<ApiClient>;
    let mockConferenceStore: MockStore<ConferenceState>;
    let eventsService: jasmine.SpyObj<EventsService>;

    const conferenceTestData = new ConferenceTestData();

    beforeEach(() => {
        videoCallService = jasmine.createSpyObj<VideoCallService>('VideoCallService', [
            'muteAllParticipants',
            'lowerAllHands',
            'muteParticipant',
            'lowerHandById',
            'spotlightParticipant'
        ]);

        apiClient = jasmine.createSpyObj<ApiClient>('ApiClient', ['dismissParticipant', 'callParticipant']);
        eventsService = jasmine.createSpyObj<EventsService>('EventsService', [
            'updateAllParticipantLocalMuteStatus',
            'updateParticipantLocalMuteStatus'
        ]);

        TestBed.configureTestingModule({
            providers: [
                VideoCallHostEffects,
                provideHttpClientTesting(),
                provideMockStore(),
                provideMockActions(() => actions$),
                { provide: ApiClient, useValue: apiClient },
                { provide: Logger, useValue: new MockLogger() },
                { provide: VideoCallService, useValue: videoCallService },
                { provide: EventsService, useValue: eventsService }
            ]
        });

        effects = TestBed.inject(VideoCallHostEffects);
        mockConferenceStore = TestBed.inject(MockStore);
    });

    afterEach(() => {
        mockConferenceStore.resetSelectors();
    });

    describe('localMuteAllParticipants$', () => {
        it('should request all participants to be locally muted', () => {
            const conference = conferenceTestData.getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);

            const action = VideoCallHostActions.localMuteAllParticipants();
            actions$ = of(action);
            effects.localMuteAllParticipants$.subscribe(() => {
                expect(eventsService.updateAllParticipantLocalMuteStatus).toHaveBeenCalledWith(vhConference.id, true);
            });
        });
    });

    describe('localUnmuteAllParticipants$', () => {
        it('should request all participants to be locally unmuted', () => {
            const conference = conferenceTestData.getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);

            const action = VideoCallHostActions.localUnmuteAllParticipants();
            actions$ = of(action);
            effects.localUnmuteAllParticipants$.subscribe(() => {
                expect(eventsService.updateAllParticipantLocalMuteStatus).toHaveBeenCalledWith(vhConference.id, false);
            });
        });
    });

    describe('remoteMuteAndLockAllParticipants$', () => {
        it('should request all participants to be remotely muted and locked', () => {
            const conference = conferenceTestData.getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);

            const action = VideoCallHostActions.remoteMuteAndLockAllParticipants();
            actions$ = of(action);
            effects.remoteMuteAndLockAllParticipants$.subscribe(() => {
                expect(videoCallService.muteAllParticipants).toHaveBeenCalledWith(true, vhConference.id);
            });
        });
    });

    describe('unlockRemoteMute$', () => {
        it('should request all participants to be remotely unmuted and unlocked', () => {
            const conference = conferenceTestData.getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);

            const action = VideoCallHostActions.unlockRemoteMute();
            actions$ = of(action);
            effects.unlockRemoteMute$.subscribe(() => {
                expect(videoCallService.muteAllParticipants).toHaveBeenCalledWith(false, vhConference.id);
            });
        });
    });

    describe('lowerAllParticipantHands$', () => {
        it('should lower all participants hands', () => {
            const conference = conferenceTestData.getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);

            const action = VideoCallHostActions.lowerAllParticipantHands();
            actions$ = of(action);
            effects.lowerAllParticipantHands$.subscribe(() => {
                expect(videoCallService.lowerAllHands).toHaveBeenCalledWith(vhConference.id);
            });
        });
    });

    describe('unlockRemoteMuteParticipant$', () => {
        it('should request a participant to be remotely unmuted and unlocked', () => {
            const conference = conferenceTestData.getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            const participant = vhConference.participants.find(x => x.role === Role.Individual);
            participant.pexipInfo = { uuid: '123' } as VHPexipParticipant;
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);

            const action = VideoCallHostActions.unlockRemoteMuteForParticipant({ participantId: participant.id });
            actions$ = of(action);
            effects.unlockRemoteMuteParticipant$.subscribe(() => {
                expect(videoCallService.muteParticipant).toHaveBeenCalledWith(
                    participant.pexipInfo.uuid,
                    false,
                    vhConference.id,
                    participant.id
                );
            });
        });
    });

    describe('lockRemoteMuteParticipant$', () => {
        it('should request a participant to be remotely muted and locked', () => {
            const conference = conferenceTestData.getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            const participant = vhConference.participants.find(x => x.role === Role.Individual);
            participant.pexipInfo = { uuid: '123' } as VHPexipParticipant;
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);

            const action = VideoCallHostActions.lockRemoteMuteForParticipant({ participantId: participant.id });
            actions$ = of(action);
            effects.lockRemoteMuteParticipant$.subscribe(() => {
                expect(videoCallService.muteParticipant).toHaveBeenCalledWith(
                    participant.pexipInfo.uuid,
                    true,
                    vhConference.id,
                    participant.id
                );
            });
        });
    });

    describe('lowerParticipantHand$', () => {
        it('should lower a participant hand', () => {
            const conference = conferenceTestData.getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            const participant = vhConference.participants.find(x => x.role === Role.Individual);
            participant.pexipInfo = { uuid: '123' } as VHPexipParticipant;
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);

            const action = VideoCallHostActions.lowerParticipantHand({ participantId: participant.id });
            actions$ = of(action);
            effects.lowerParticipantHand$.subscribe(() => {
                expect(videoCallService.lowerHandById).toHaveBeenCalledWith(participant.pexipInfo.uuid, vhConference.id, participant.id);
            });
        });
    });

    describe('localMuteParticipant$', () => {
        it('should request a participant to be locally muted', () => {
            const conference = conferenceTestData.getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);

            const action = VideoCallHostActions.localMuteParticipant({ participantId: vhConference.participants[0].id });
            actions$ = of(action);
            effects.localMuteParticipant$.subscribe(() => {
                expect(eventsService.updateParticipantLocalMuteStatus).toHaveBeenCalledWith(
                    vhConference.id,
                    vhConference.participants[0].id,
                    true
                );
            });
        });
    });

    describe('localUnmuteParticipant$', () => {
        it('should request a participant to be locally unmuted', () => {
            const conference = conferenceTestData.getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);

            const action = VideoCallHostActions.localMuteParticipant({ participantId: vhConference.participants[0].id });
            actions$ = of(action);
            effects.localUnmuteParticipant$.subscribe(() => {
                expect(eventsService.updateParticipantLocalMuteStatus).toHaveBeenCalledWith(
                    vhConference.id,
                    vhConference.participants[0].id,
                    false
                );
            });
        });
    });

    describe('spotlightParticipant$', () => {
        it('should spotlight a participant', () => {
            const conference = conferenceTestData.getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            const participant = vhConference.participants.find(x => x.role === Role.Individual);
            participant.pexipInfo = { uuid: '123' } as VHPexipParticipant;
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);

            const action = VideoCallHostActions.spotlightParticipant({ participantId: participant.id });
            actions$ = of(action);
            effects.spotlightParticipant$.subscribe(() => {
                expect(videoCallService.spotlightParticipant).toHaveBeenCalledWith(
                    participant.pexipInfo.uuid,
                    true,
                    vhConference.id,
                    participant.id
                );
            });
        });
    });

    describe('removeSpotlightForParticipant$', () => {
        it('should remove spotlight for a participant', () => {
            const conference = conferenceTestData.getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            const participant = vhConference.participants.find(x => x.role === Role.Individual);
            participant.pexipInfo = { uuid: '123' } as VHPexipParticipant;
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);

            const action = VideoCallHostActions.removeSpotlightForParticipant({ participantId: participant.id });
            actions$ = of(action);
            effects.removeSpotlightForParticipant$.subscribe(() => {
                expect(videoCallService.spotlightParticipant).toHaveBeenCalledWith(
                    participant.pexipInfo.uuid,
                    false,
                    vhConference.id,
                    participant.id
                );
            });
        });
    });

    describe('admitParticipantOnCountdownIncomplete$', () => {
        it('should dispatch success action when admit api call is successful', () => {
            const conference = conferenceTestData.getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            const participant = vhConference.participants.find(x => x.role === Role.Individual);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getCountdownComplete, false);

            const action = VideoCallHostActions.admitParticipant({ participantId: participant.id });
            actions$ = of(action);

            const expectedAction = VideoCallHostActions.admitParticipantSuccess();
            apiClient.callParticipant.and.returnValue(of(void 0));

            // Act
            actions$ = hot('-a', { a: action });
            const expected = cold('-b', { b: expectedAction });

            // Assert
            expect(effects.admitParticipantOnCountdownIncomplete$).toBeObservable(expected);
        });

        it('should dispatch error action when admit api call fails', () => {
            const conference = conferenceTestData.getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            const participant = vhConference.participants.find(x => x.role === Role.Individual);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getCountdownComplete, false);

            const action = VideoCallHostActions.admitParticipant({ participantId: participant.id });
            actions$ = of(action);

            const expectedError = new Error('Test Failure');
            const expectedAction = VideoCallHostActions.admitParticipantFailure({
                conferenceId: vhConference.id,
                error: expectedError,
                participantId: participant.id
            });
            apiClient.callParticipant.and.returnValue(cold('#', {}, expectedError));

            // Act
            actions$ = hot('-a', { a: action });
            const expected = cold('-b', { b: expectedAction });

            // Assert
            expect(effects.admitParticipantOnCountdownIncomplete$).toBeObservable(expected);
        });

        describe('admitParticipantOnCountdownComplete$', () => {
            it('should dispatch transfer action and then admit after 10 seconds', () => {
                // Arrange
                spyOn(mockConferenceStore, 'dispatch');
                const conference = conferenceTestData.getConferenceDetailNow();
                const vhConference = mapConferenceToVHConference(conference);
                const participant = vhConference.participants.find(x => x.role === Role.Individual);

                mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
                mockConferenceStore.overrideSelector(ConferenceSelectors.getCountdownComplete, true);

                apiClient.callParticipant.and.returnValue(of(void 0));

                const action = VideoCallHostActions.admitParticipant({ participantId: participant.id });
                const transferAction = ConferenceActions.sendTransferRequest({
                    conferenceId: vhConference.id,
                    participantId: participant.id,
                    transferDirection: TransferDirection.In
                });
                const expectedAction = VideoCallHostActions.admitParticipantSuccess();

                // Act
                const scheduler = getTestScheduler();
                scheduler.run(({ expectObservable }) => {
                    actions$ = hot('-a', { a: action });

                    const expectedMarble = '- 10s b';
                    const expectedValues = {
                        a: transferAction,
                        b: expectedAction
                    };

                    // despite dispatching a transfer request via tap, only the admit success action should be returned by the effect
                    expectObservable(effects.admitParticipantOnCountdownComplete$).toBe(expectedMarble, expectedValues);
                });

                // Assert store dispatch
                expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(transferAction);
            });

            it('should dispatch transfer action and then failure if api call fails after delay', () => {
                // Arrange
                spyOn(mockConferenceStore, 'dispatch');
                const conference = conferenceTestData.getConferenceDetailNow();
                const vhConference = mapConferenceToVHConference(conference);
                const participant = vhConference.participants.find(x => x.role === Role.Individual);

                mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
                mockConferenceStore.overrideSelector(ConferenceSelectors.getCountdownComplete, true);

                const expectedError = new Error('Test Failure');
                const action = VideoCallHostActions.admitParticipant({ participantId: participant.id });
                const transferAction = ConferenceActions.sendTransferRequest({
                    conferenceId: vhConference.id,
                    participantId: participant.id,
                    transferDirection: TransferDirection.In
                });
                const expectedAction = VideoCallHostActions.admitParticipantFailure({
                    conferenceId: vhConference.id,
                    error: expectedError,
                    participantId: participant.id
                });
                apiClient.callParticipant.and.returnValue(cold('#', {}, expectedError));

                // Act
                const scheduler = getTestScheduler();
                scheduler.run(({ expectObservable }) => {
                    actions$ = hot('-a', { a: action });

                    const expectedMarble = '- 10s b';
                    const expectedValues = {
                        a: transferAction,
                        b: expectedAction
                    };

                    // despite dispatching a transfer request via tap, only the admit success action should be returned by the effect
                    expectObservable(effects.admitParticipantOnCountdownComplete$).toBe(expectedMarble, expectedValues);
                });

                // Assert store dispatch
                expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(transferAction);
            });
        });
    });

    describe('admitParticipantFailure$', () => {
        it('should dispatch a transfer request to the participant', () => {
            const conference = conferenceTestData.getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            const participant = vhConference.participants.find(x => x.role === Role.Individual);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);

            const action = VideoCallHostActions.admitParticipantFailure({
                conferenceId: vhConference.id,
                error: new Error('Test Failure'),
                participantId: participant.id
            });
            const expectedAction = ConferenceActions.sendTransferRequest({
                conferenceId: vhConference.id,
                participantId: participant.id,
                transferDirection: TransferDirection.Out
            });

            actions$ = hot('-a', { a: action });
            const expected = cold('-b', { b: expectedAction });

            expect(effects.admitParticipantFailure$).toBeObservable(expected);
        });
    });

    describe('dismissParticipant$', () => {
        it('should dismiss a participant and dispatch success action', () => {
            const conference = conferenceTestData.getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            const participant = vhConference.participants.find(x => x.role === Role.Individual);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            apiClient.dismissParticipant.and.returnValue(of(void 0));

            const action = VideoCallHostActions.dismissParticipant({ participantId: participant.id });
            const expectedAction = VideoCallHostActions.dismissParticipantSuccess();
            actions$ = hot('-a', { a: action });
            const expected = cold('-b', { b: expectedAction });

            expect(effects.dismissParticipant$).toBeObservable(expected);
        });

        it('should dispatch error action when dismiss api call fails', () => {
            const conference = conferenceTestData.getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conference);
            const participant = vhConference.participants.find(x => x.role === Role.Individual);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);

            const expectedError = new Error('Test Failure');
            const action = VideoCallHostActions.dismissParticipant({ participantId: participant.id });
            const expectedAction = VideoCallHostActions.dismissParticipantFailure({
                error: expectedError
            });
            apiClient.dismissParticipant.and.returnValue(cold('#', {}, expectedError));

            actions$ = hot('-a', { a: action });
            const expected = cold('-b', { b: expectedAction });

            expect(effects.dismissParticipant$).toBeObservable(expected);
        });
    });
});
