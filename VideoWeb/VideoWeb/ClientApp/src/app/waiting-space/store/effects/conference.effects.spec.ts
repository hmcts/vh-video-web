import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { cold, hot } from 'jasmine-marbles';
import { Observable, of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing'; // import this

import { ConferenceEffects } from './conference.effects';
import { ApiClient } from 'src/app/services/clients/api-client';
import { ConferenceActions } from '../actions/conference.actions';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { mapConferenceToVHConference } from '../models/api-contract-to-state-model-mappers';
import { VideoCallService } from '../../services/video-call.service';
import { provideMockStore } from '@ngrx/store/testing';

describe('ConferenceEffectsEffects', () => {
    let actions$: Observable<any>;
    let effects: ConferenceEffects;
    let apiClient: jasmine.SpyObj<ApiClient>;
    let videoCallService: jasmine.SpyObj<VideoCallService>;

    beforeEach(() => {
        apiClient = jasmine.createSpyObj('ApiClient', ['getConferenceById']);
        videoCallService = jasmine.createSpyObj('VideoCallService', ['receiveAudioFromMix', 'sendParticipantAudioToMixes']);
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                ConferenceEffects,
                provideMockStore(),
                provideMockActions(() => actions$),
                { provide: ApiClient, useValue: apiClient },
                { provide: VideoCallService, useValue: videoCallService }
            ]
        });

        effects = TestBed.inject(ConferenceEffects);
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });

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
