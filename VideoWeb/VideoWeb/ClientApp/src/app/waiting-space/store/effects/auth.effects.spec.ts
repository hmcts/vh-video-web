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
import { cold, hot } from 'jasmine-marbles';
import { ApiClient, Role, UserProfileResponse } from 'src/app/services/clients/api-client';
import { AuthEffects } from './auth.effects';
import { AuthActions } from '../actions/auth.actions';

describe('AuthEffects', () => {
    const testData = new ConferenceTestData();
    let vhConference: VHConference;

    let actions$: Observable<any>;
    let effects: AuthEffects;
    let apiClient: jasmine.SpyObj<ApiClient>;
    let mockConferenceStore: MockStore<ConferenceState>;

    beforeEach(() => {
        vhConference = mapConferenceToVHConference(testData.getConferenceDetailNow());
        apiClient = jasmine.createSpyObj<ApiClient>('ApiClient', ['getUserProfile']);

        TestBed.configureTestingModule({
            providers: [
                AuthEffects,
                provideMockStore(),
                provideMockActions(() => actions$),
                { provide: ApiClient, useValue: apiClient },
                { provide: Logger, useValue: new MockLogger() }
            ]
        });

        effects = TestBed.inject(AuthEffects);
        mockConferenceStore = TestBed.inject(MockStore);
    });

    describe('loadUserProfile$', () => {
        it('should load the user profile and dispatch a success action', () => {
            // Arrange
            const profile = new UserProfileResponse({
                roles: [Role.Judge],
                first_name: 'first_name',
                last_name: 'last_name',
                display_name: 'display_name',
                username: 'username',
                name: 'name'
            });
            apiClient.getUserProfile.and.returnValue(of(profile));
            const action = AuthActions.loadUserProfile();

            // Act
            actions$ = hot('-a', { a: action });
            const expected = cold('-b', {
                b: AuthActions.loadUserProfileSuccess({
                    userProfile: {
                        roles: profile.roles,
                        firstName: profile.first_name,
                        lastName: profile.last_name,
                        displayName: profile.display_name,
                        username: profile.username,
                        name: profile.name
                    }
                })
            });

            // Assert
            expect(effects.loadUserProfile$).toBeObservable(expected);
        });
    });
});
