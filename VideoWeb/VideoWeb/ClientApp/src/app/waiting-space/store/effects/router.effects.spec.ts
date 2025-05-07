import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Observable, of } from 'rxjs';
import { RouterEffects } from './router.effects';
import { ConferenceActions } from '../actions/conference.actions';
import { ROUTER_NAVIGATION } from '@ngrx/router-store';
import { Title } from '@angular/platform-browser';
import * as ConferenceSelectors from '../selectors/conference.selectors';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { mapConferenceToVHConference } from '../models/api-contract-to-state-model-mappers';
import { VHConference } from '../models/vh-conference';
import { ConferenceState } from '../reducers/conference.reducer';
import { Role } from 'src/app/services/clients/api-client';

import { selectConferenceId } from '../selectors/router.selectors';
import { WaitingRoomUserRole } from '../../waiting-room-shared/models/waiting-room-user-role';

describe('RouterEffects', () => {
    let actions$: Observable<any>;
    let effects: RouterEffects;
    let mockConferenceStore: MockStore<ConferenceState>;

    let titleService: jasmine.SpyObj<Title>;

    let vhConference: VHConference;

    beforeEach(() => {
        const conferenceResponse = new ConferenceTestData().getConferenceDetailNow();
        vhConference = mapConferenceToVHConference(conferenceResponse);
        titleService = jasmine.createSpyObj('Title', ['setTitle']);

        TestBed.configureTestingModule({
            providers: [
                RouterEffects,
                provideMockStore(),
                provideMockActions(() => actions$),
                provideMockActions(() => actions$),
                { provide: Title, useValue: titleService }
            ]
        });

        effects = TestBed.inject(RouterEffects);
        mockConferenceStore = TestBed.inject(MockStore);
    });

    afterEach(() => {
        mockConferenceStore.resetSelectors();
    });

    describe('roomTransfer$', () => {
        it('should set the correct title on room transfer - Waiting Room', done => {
            const participant = vhConference.participants.find(x => x.role === Role.Individual);

            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);

            actions$ = of(
                ConferenceActions.updateParticipantRoom({
                    fromRoom: 'ConsultationRoom',
                    participantId: participant.id,
                    toRoom: 'WaitingRoom'
                })
            );

            effects.roomTransfer$.subscribe(() => {
                expect(titleService.setTitle).toHaveBeenCalledWith('Video Hearings - Waiting Room');
                done();
            });
        });

        it('should set the correct title on room transfer - Judicial Consultation Room', done => {
            const participant = vhConference.participants.find(x => x.role === Role.Individual);

            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);

            actions$ = of(
                ConferenceActions.updateParticipantRoom({
                    fromRoom: 'WaitingRoom',
                    participantId: participant.id,
                    toRoom: 'JudgeConsultationRoom'
                })
            );

            effects.roomTransfer$.subscribe(() => {
                expect(titleService.setTitle).toHaveBeenCalledWith('Video Hearings - JOH Consultation Room');
                done();
            });
        });

        it('should set the correct title on room transfer - Private Consultation Room', done => {
            const participant = vhConference.participants.find(x => x.role === Role.Individual);

            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);

            actions$ = of(
                ConferenceActions.updateParticipantRoom({
                    fromRoom: 'WaitingRoom',
                    participantId: participant.id,
                    toRoom: 'ConsultationRoom'
                })
            );

            effects.roomTransfer$.subscribe(() => {
                expect(titleService.setTitle).toHaveBeenCalledWith('Video Hearings - Private Consultation Room');
                done();
            });
        });

        it('should set the correct title on room transfer - Hearing Room', done => {
            const participant = vhConference.participants.find(x => x.role === Role.Individual);

            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);

            actions$ = of(
                ConferenceActions.updateParticipantRoom({
                    fromRoom: 'WaitingRoom',
                    participantId: participant.id,
                    toRoom: 'HearingRoom'
                })
            );

            effects.roomTransfer$.subscribe(() => {
                expect(titleService.setTitle).toHaveBeenCalledWith('Video Hearings - Hearing Room');
                done();
            });
        });
    });

    describe('trackConferenceNavigation$', () => {
        it('should dispatch loadConference when the conferenceId changes', done => {
            mockConferenceStore.overrideSelector(selectConferenceId, 'conference1');

            actions$ = of({ type: ROUTER_NAVIGATION });

            effects.trackConferenceNavigation$.subscribe(action => {
                expect(action).toEqual(ConferenceActions.loadConference({ conferenceId: 'conference1' }));
                done();
            });
        });
    });

    describe('setWaitingRoomPageTitle$', () => {
        it('should set title when entering as a Participant', done => {
            actions$ = of(
                ConferenceActions.enterWaitingRoomAsNonHost({
                    userRole: WaitingRoomUserRole.Participant
                })
            );

            effects.setWaitingRoomPageTitle$.subscribe(() => {
                expect(titleService.setTitle).toHaveBeenCalledWith('Participant waiting room');
                done();
            });
        });

        it('should set title when entering as a JOH', done => {
            actions$ = of(
                ConferenceActions.enterWaitingRoomAsNonHost({
                    userRole: WaitingRoomUserRole.Joh
                })
            );

            effects.setWaitingRoomPageTitle$.subscribe(() => {
                expect(titleService.setTitle).toHaveBeenCalledWith('JOH waiting room');
                done();
            });
        });
    });
});
