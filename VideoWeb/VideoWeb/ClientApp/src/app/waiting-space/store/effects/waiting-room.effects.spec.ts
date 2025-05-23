import { Observable, of } from 'rxjs';
import { WaitingRoomEffects } from './waiting-room.effects';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ConferenceState } from '../reducers/conference.reducer';
import { ClockService } from 'src/app/services/clock.service';
import { RoomClosingToastrService } from '../../services/room-closing-toast.service';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { mapConferenceToVHConference } from '../models/api-contract-to-state-model-mappers';
import { VHConference, VHParticipant } from '../models/vh-conference';
import { getActiveConference, getLoggedInParticipant } from '../selectors/conference.selectors';
import { ParticipantStatus } from 'src/app/services/clients/api-client';
import { ConferenceActions } from '../actions/conference.actions';

describe('WaitingRoomEffects', () => {
    let effects: WaitingRoomEffects;
    let actions$: Observable<any>;
    let mockConferenceStore: MockStore<ConferenceState>;
    let clockService: jasmine.SpyObj<ClockService>;
    let roomClosingToastrService: jasmine.SpyObj<RoomClosingToastrService>;

    const testData = new ConferenceTestData();
    let vhConference: VHConference;
    let participant: VHParticipant;

    beforeEach(() => {
        vhConference = mapConferenceToVHConference(testData.getConferenceDetailNow());
        participant = vhConference.participants[0];

        clockService = jasmine.createSpyObj<ClockService>('ClockService', ['getClock']);
        clockService.getClock.and.returnValue(of(new Date()));
        roomClosingToastrService = jasmine.createSpyObj<RoomClosingToastrService>('RoomClosingToastrService', [
            'showRoomClosingAlert',
            'clearToasts'
        ]);
        TestBed.configureTestingModule({
            providers: [
                WaitingRoomEffects,
                provideMockStore(),
                provideMockActions(() => actions$),
                { provide: ClockService, useValue: clockService },
                { provide: RoomClosingToastrService, useValue: roomClosingToastrService }
            ]
        });

        effects = TestBed.inject(WaitingRoomEffects);
        mockConferenceStore = TestBed.inject(MockStore);
    });

    afterEach(() => {
        mockConferenceStore.resetSelectors();
    });

    it('should create', () => {
        expect(effects).toBeTruthy();
    });

    describe('roomClosingNotification$', () => {
        it('should show room closing alert when participant is in consultation', () => {
            // Arrange
            participant.status = ParticipantStatus.InConsultation;
            mockConferenceStore.overrideSelector(getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(getLoggedInParticipant, participant);

            // Act
            effects.roomClosingNotification$.subscribe(() => {
                // Assert
                expect(roomClosingToastrService.showRoomClosingAlert).toHaveBeenCalled();

                mockConferenceStore.overrideSelector(getLoggedInParticipant, { ...participant, status: ParticipantStatus.Available });
                mockConferenceStore.refreshState();

                // assert that the showRoomClosingAlert method is not called again
                expect(roomClosingToastrService.showRoomClosingAlert).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('resetDismissedToasts$', () => {
        it('should clear toasts when leaving conference', () => {
            // Arrange
            mockConferenceStore.overrideSelector(getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(getLoggedInParticipant, participant);

            // Act
            const action = ConferenceActions.leaveConference({ conferenceId: vhConference.id });
            actions$ = of(action);
            effects.resetDismissedToasts$.subscribe(() => {
                // Assert
                expect(roomClosingToastrService.clearToasts).toHaveBeenCalled();
            });
        });

        it('should clear toasts when updating participant room', () => {
            // Arrange
            mockConferenceStore.overrideSelector(getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(getLoggedInParticipant, participant);

            // Act
            actions$ = of(ConferenceActions.updateParticipantRoom({ participantId: participant.id, fromRoom: 'room1', toRoom: 'room2' }));
            effects.resetDismissedToasts$.subscribe(() => {
                // Assert
                expect(roomClosingToastrService.clearToasts).toHaveBeenCalled();
            });
        });
    });
});
