import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { cold, hot } from 'jasmine-marbles';
import { Observable, of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing'; // import this

import { ReferenceDataEffects } from './reference-data.effects';
import { ApiClient } from 'src/app/services/clients/api-client';
import { ReferenceActions } from '../actions/reference-data.actions';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { VideoCallService } from '../../services/video-call.service';
import { mapInterpeterLanguageToVHInterpreterLanguage } from '../models/api-contract-to-state-model-mappers';

describe('ReferenceDataEffects', () => {
    let actions$: Observable<any>;
    let effects: ReferenceDataEffects;
    let apiClient: jasmine.SpyObj<ApiClient>;
    let videoCallService: jasmine.SpyObj<VideoCallService>;

    beforeEach(() => {
        apiClient = jasmine.createSpyObj('ApiClient', ['getAvailableInterpreterLanguages']);
        videoCallService = jasmine.createSpyObj('VideoCallService', ['receiveAudioFromMix', 'sendParticipantAudioToMixes']);
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [ReferenceDataEffects, provideMockActions(() => actions$), { provide: ApiClient, useValue: apiClient }]
        });

        effects = TestBed.inject(ReferenceDataEffects);
    });

    it('should be created', () => {
        expect(effects).toBeTruthy();
    });

    describe('loadInterpreterLanguages$', () => {
        it('should call getAvailableInterpreterLanguages and expect load interpreter languages action to be dispatched on success', () => {
            // arrange
            const languagesResponses = new ConferenceTestData().getInterpreterLanguageResponse();
            apiClient.getAvailableInterpreterLanguages.and.returnValue(of(languagesResponses));

            const mappedLanguages = languagesResponses.map(mapInterpeterLanguageToVHInterpreterLanguage);

            // act
            const action = ReferenceActions.loadInterpreterLanguages();
            actions$ = hot('-a', { a: action });

            // assert
            const expected = cold('-b', { b: ReferenceActions.loadInterpreterLanguagesSuccess({ languages: mappedLanguages }) });
            expect(effects.loadInterpreterLanguages$).toBeObservable(expected);
            expect(apiClient.getAvailableInterpreterLanguages).toHaveBeenCalled();
        });

        it('should call getAvailableInterpreterLanguages and expect load interpreter languages failure action to be dispatched on error', () => {
            // arrange
            const error = new Error('failed to load interpreter languages');
            apiClient.getAvailableInterpreterLanguages.and.returnValue(cold('#', {}, error)); // error observable

            // act
            const action = ReferenceActions.loadInterpreterLanguages();
            actions$ = hot('-a', { a: action });

            // assert
            const expected = cold('-b', { b: ReferenceActions.loadInterpreterLanguagesFailure({ error }) });
            expect(effects.loadInterpreterLanguages$).toBeObservable(expected);
            expect(apiClient.getAvailableInterpreterLanguages).toHaveBeenCalled();
        });
    });
});
