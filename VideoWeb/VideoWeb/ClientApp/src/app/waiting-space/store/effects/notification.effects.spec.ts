import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of } from 'rxjs';
import { NotificationEffects } from './notification.effects';
import { ConferenceActions } from '../actions/conference.actions';
import { NotificationToastrService } from '../../services/notification-toastr.service';
import { Store } from '@ngrx/store';
import { ConferenceState } from '../reducers/conference.reducer';
import * as ConferenceSelectors from '../selectors/conference.selectors';
import { ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { mapConferenceToVHConference } from '../models/api-contract-to-state-model-mappers';
import { createMockStore, MockStore, provideMockStore } from '@ngrx/store/testing';
import { hot } from 'jasmine-marbles';

describe('NotificationEffects', () => {
    const testData = new ConferenceTestData();
    const conference = testData.getConferenceDetailNow();

    let actions$: Observable<any>;
    let effects: NotificationEffects;
    let mockConferenceStore: MockStore<ConferenceState>;
    let toastNotificationService: jasmine.SpyObj<NotificationToastrService>;

    beforeEach(() => {
        toastNotificationService = jasmine.createSpyObj('NotificationToastrService', ['showParticipantLeftHearingRoom']);

        mockConferenceStore = createMockStore({
            initialState: { currentConference: mapConferenceToVHConference(conference), availableRooms: [] }
        });

        TestBed.configureTestingModule({
            providers: [
                NotificationEffects,
                provideMockStore(),
                provideMockActions(() => actions$),
                { provide: NotificationToastrService, useValue: toastNotificationService }
            ]
        });

        effects = TestBed.inject(NotificationEffects);
        mockConferenceStore = TestBed.inject(MockStore);
    });

    afterAll(() => {
        mockConferenceStore.resetSelectors();
    });

    describe('participantLeaveHearingRoomSuccess$', () => {
        beforeEach(() => {
            mockConferenceStore.resetSelectors();
        });
        it('should show participant left hearing room notification for host participants when active conference matches conference id', () => {
            // arrange
            const vhConference = mapConferenceToVHConference(conference);
            const vhParticipant = vhConference.participants.find(x => x.role === Role.Individual);
            const loggedInParticipant = vhConference.participants.find(x => x.role === Role.Judge);

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            // act
            const action = ConferenceActions.participantLeaveHearingRoomSuccess({
                conferenceId: vhConference.id,
                participant: vhParticipant
            });
            actions$ = hot('-a', { a: action });

            // assert
            effects.participantLeaveHearingRoomSuccess$.subscribe(() => {
                expect(toastNotificationService.showParticipantLeftHearingRoom).toHaveBeenCalled();
            });
        });

        it('should not show participant left hearing room notification for non-host participants', () => {
            // arrange
            const vhConference = mapConferenceToVHConference(conference);
            const vhParticipant = vhConference.participants.find(x => x.role === Role.Individual);
            const loggedInParticipant = vhConference.participants.find(x => x.role !== Role.Judge);

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            // act
            const action = ConferenceActions.participantLeaveHearingRoomSuccess({
                conferenceId: vhConference.id,
                participant: vhParticipant
            });
            actions$ = hot('-a', { a: action });

            // assert
            effects.participantLeaveHearingRoomSuccess$.subscribe(() => {
                expect(toastNotificationService.showParticipantLeftHearingRoom).toHaveBeenCalledTimes(0);
            });
        });

        it('should not show participant left hearing room notification when active conference does not match conference id', () => {
            // arrange
            const vhConference = mapConferenceToVHConference(conference);
            const vhParticipant = vhConference.participants.find(x => x.role === Role.Individual);
            const loggedInParticipant = vhConference.participants.find(x => x.role !== Role.Judge);

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            // act
            const action = ConferenceActions.participantLeaveHearingRoomSuccess({
                conferenceId: '1234567',
                participant: vhParticipant
            });
            actions$ = hot('-a', { a: action });

            // assert
            effects.participantLeaveHearingRoomSuccess$.subscribe(() => {
                expect(toastNotificationService.showParticipantLeftHearingRoom).toHaveBeenCalledTimes(0);
            });
        });
    });
});
