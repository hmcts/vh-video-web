import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { cold, hot } from 'jasmine-marbles';
import { Observable, of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing'; // import this

import { ConferenceEffects } from './conference.effects';
import { ApiClient } from 'src/app/services/clients/api-client';
import { ConferenceActions } from '../actions/conference.actions';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { mapConferenceToVHConference, mapParticipantToVHParticipant } from '../models/api-contract-to-state-model-mappers';
import { VideoCallService } from '../../services/video-call.service';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ConferenceState } from '../reducers/conference.reducer';
import * as ConferenceSelectors from '../selectors/conference.selectors';
import { VHParticipant } from '../models/vh-conference';

describe('ConferenceEffects', () => {
    let actions$: Observable<any>;
    let effects: ConferenceEffects;
    let apiClient: jasmine.SpyObj<ApiClient>;
    let videoCallService: jasmine.SpyObj<VideoCallService>;
    let mockConferenceStore: MockStore<ConferenceState>;

    beforeEach(() => {
        apiClient = jasmine.createSpyObj('ApiClient', ['getConferenceById']);
        videoCallService = jasmine.createSpyObj('VideoCallService', ['receiveAudioFromMix', 'sendParticipantAudioToMixes']);
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                ConferenceEffects,
                provideMockStore(),
                provideMockActions(() => actions$),
                { provide: ApiClient, useValue: apiClient }
            ]
        });

        effects = TestBed.inject(ConferenceEffects);
        mockConferenceStore = TestBed.inject(MockStore);
    });

    afterEach(() => {
        mockConferenceStore.resetSelectors();
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });

    describe('loadConference$', () => {
        it('should call getConferenceById and expect load conference action to be dispatched on success', () => {
            // arrange
            const conferenceId = '123';
            const conferenceResponse = new ConferenceTestData().getConferenceDetailNow();
            const vhConference = mapConferenceToVHConference(conferenceResponse);
            apiClient.getConferenceById.and.returnValue(of(conferenceResponse));

            // act
            const action = ConferenceActions.loadConference({ conferenceId });
            actions$ = hot('-a', { a: action });

            // assert
            const expected = cold('-b', { b: ConferenceActions.loadConferenceSuccess({ conference: vhConference }) });
            expect(effects.loadConference$).toBeObservable(expected);
            expect(apiClient.getConferenceById).toHaveBeenCalledWith(conferenceId);
        });

        it('should call getConferenceById and expect load conference failure action to be dispatched on error', () => {
            // arrange
            const conferenceId = '123';
            const error = new Error('failed to load conference');
            apiClient.getConferenceById.and.returnValue(cold('#', {}, error)); // error observable

            // act
            const action = ConferenceActions.loadConference({ conferenceId });
            actions$ = hot('-a', { a: action });

            // assert
            const expected = cold('-b', { b: ConferenceActions.loadConferenceFailure({ error }) });
            expect(effects.loadConference$).toBeObservable(expected);
            expect(apiClient.getConferenceById).toHaveBeenCalledWith(conferenceId);
        });
    });

    describe('loadLoggedInParticipant$', () => {
        it('should call getParticipants and expect load logged in participant action to be dispatched on success', () => {
            // arrange
            const participants = new ConferenceTestData().getListOfParticipants();
            const vhParticipants: VHParticipant[] = participants.map(mapParticipantToVHParticipant);
            const participantId = vhParticipants[0].id;
            mockConferenceStore.overrideSelector(ConferenceSelectors.getParticipants, vhParticipants);

            // act
            const action = ConferenceActions.loadLoggedInParticipant({ participantId });
            actions$ = hot('-a', { a: action });

            // assert
            const expected = cold('-b', { b: ConferenceActions.loadLoggedInParticipantSuccess({ participant: vhParticipants[0] }) });
            expect(effects.loadLoggedInParticipant$).toBeObservable(expected);
        });
    });
});
