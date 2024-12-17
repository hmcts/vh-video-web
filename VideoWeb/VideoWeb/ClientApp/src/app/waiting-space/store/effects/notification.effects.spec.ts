import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';
import { NotificationEffects } from './notification.effects';
import { ConferenceActions } from '../actions/conference.actions';
import { NotificationToastrService } from '../../services/notification-toastr.service';
import { ConferenceState } from '../reducers/conference.reducer';
import * as ConferenceSelectors from '../selectors/conference.selectors';
import { HearingLayout, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { mapConferenceToVHConference } from '../models/api-contract-to-state-model-mappers';
import { createMockStore, MockStore, provideMockStore } from '@ngrx/store/testing';
import { hot } from 'jasmine-marbles';
import { VHConference, VHEndpoint, VHParticipant } from '../models/vh-conference';

describe('NotificationEffects', () => {
    const testData = new ConferenceTestData();
    const conference = testData.getConferenceDetailNow();
    let vhConference: VHConference;

    let actions$: Observable<any>;
    let effects: NotificationEffects;
    let mockConferenceStore: MockStore<ConferenceState>;
    let toastNotificationService: jasmine.SpyObj<NotificationToastrService>;

    beforeEach(() => {
        toastNotificationService = jasmine.createSpyObj<NotificationToastrService>('NotificationToastrService', [
            'showParticipantLeftHearingRoom',
            'showEndpointAdded',
            'showEndpointUpdated',
            'showEndpointLinked',
            'showEndpointUnlinked',
            'showEndpointConsultationClosed',
            'showHearingLayoutchanged'
        ]);

        vhConference = mapConferenceToVHConference(conference);
        mockConferenceStore = createMockStore({
            initialState: { currentConference: vhConference, availableRooms: [] }
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

    describe('endpointsAdded$', () => {
        beforeEach(() => {
            mockConferenceStore.resetSelectors();
        });

        it('should call showEndpointAdded when endpoints are added', () => {
            const conferenceId = '1234567';
            const endpoints = [
                { id: '1232323', displayName: 'DispName1' } as VHEndpoint,
                { id: '2356789', displayName: 'DispName2' } as VHEndpoint
            ];
            const action = ConferenceActions.addNewEndpoints({ conferenceId, endpoints });
            const loggedInParticipant = { status: ParticipantStatus.InHearing, role: Role.Individual } as VHParticipant;
            const activeConference = { id: conferenceId } as VHConference;

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, activeConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            actions$ = hot('-a-', { a: action });

            effects.endpointsAdded$.subscribe(() => {
                expect(toastNotificationService.showEndpointAdded).toHaveBeenCalledWith(endpoints[0], true);
                expect(toastNotificationService.showEndpointAdded).toHaveBeenCalledWith(endpoints[1], true);
            });
        });

        it('should not call showEndpointAdded when conference id does not match', () => {
            const conferenceId = '1234567';
            const endpoints = [
                { id: '1232323', displayName: 'DispName1' } as VHEndpoint,
                { id: '2356789', displayName: 'DispName2' } as VHEndpoint
            ];
            const action = ConferenceActions.addNewEndpoints({ conferenceId, endpoints });
            const loggedInParticipant = { status: ParticipantStatus.InHearing, role: Role.Individual } as VHParticipant;
            const activeConference = { id: '123' } as VHConference;

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, activeConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            actions$ = hot('-a-', { a: action });

            effects.endpointsAdded$.subscribe(() => {
                expect(toastNotificationService.showEndpointAdded).toHaveBeenCalledTimes(0);
            });
        });
    });

    describe('endpointsUpdated$', () => {
        beforeEach(() => {
            mockConferenceStore.resetSelectors();
        });

        it('should call showEndpointUpdated when endpoints are updated', () => {
            const conferenceId = '1234567';
            const endpoints = [
                { id: '1232323', displayName: 'DispName1' } as VHEndpoint,
                { id: '2356789', displayName: 'DispName2' } as VHEndpoint
            ];
            const action = ConferenceActions.updateExistingEndpoints({ conferenceId, endpoints });
            const loggedInParticipant = { status: ParticipantStatus.InHearing, role: Role.Individual } as VHParticipant;
            const activeConference = { id: conferenceId } as VHConference;

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, activeConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            actions$ = hot('-a-', { a: action });

            effects.endpointsUpdated$.subscribe(() => {
                expect(toastNotificationService.showEndpointUpdated).toHaveBeenCalledWith(endpoints[0], true);
                expect(toastNotificationService.showEndpointUpdated).toHaveBeenCalledWith(endpoints[1], true);
            });
        });

        it('should not call showEndpointUpdated when conference id does not match', () => {
            const conferenceId = '1234567';
            const endpoints = [
                { id: '1232323', displayName: 'DispName1' } as VHEndpoint,
                { id: '2356789', displayName: 'DispName2' } as VHEndpoint
            ];
            const action = ConferenceActions.updateExistingEndpoints({ conferenceId, endpoints });
            const loggedInParticipant = { status: ParticipantStatus.InHearing, role: Role.Individual } as VHParticipant;
            const activeConference = { id: '123' } as VHConference;

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, activeConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            actions$ = hot('-a-', { a: action });

            effects.endpointsUpdated$.subscribe(() => {
                expect(toastNotificationService.showEndpointUpdated).toHaveBeenCalledTimes(0);
            });
        });
    });

    describe('endpointLinkUpdated$', () => {
        beforeEach(() => {
            mockConferenceStore.resetSelectors();
        });

        it('should call showEndpointLinked when participant is linked to endpoint', () => {
            const conferenceId = '1234567';
            const endpoint = { id: '1232323', displayName: 'DispName1' } as VHEndpoint;
            const action = ConferenceActions.linkParticipantToEndpoint({ conferenceId, endpoint: endpoint.displayName });
            const loggedInParticipant = { status: ParticipantStatus.InHearing, role: Role.Individual } as VHParticipant;
            const activeConference = { id: conferenceId } as VHConference;

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, activeConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            actions$ = hot('-a-', { a: action });

            effects.endpointLinkUpdated$.subscribe(() => {
                expect(toastNotificationService.showEndpointLinked).toHaveBeenCalledWith(endpoint.displayName, true);
            });
        });

        it('should not call showEndpointLinked when conference id does not match', () => {
            const conferenceId = '1234567';
            const endpoint = { id: '1232323', displayName: 'DispName1' } as VHEndpoint;
            const action = ConferenceActions.linkParticipantToEndpoint({ conferenceId, endpoint: endpoint.displayName });
            const loggedInParticipant = { status: ParticipantStatus.InHearing, role: Role.Individual } as VHParticipant;
            const activeConference = { id: '123' } as VHConference;

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, activeConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            actions$ = hot('-a-', { a: action });

            effects.endpointLinkUpdated$.subscribe(() => {
                expect(toastNotificationService.showEndpointLinked).toHaveBeenCalledTimes(0);
            });
        });
    });

    describe('endpointUnlinked$', () => {
        beforeEach(() => {
            mockConferenceStore.resetSelectors();
        });

        it('should call showEndpointUnlinked when participant is unlinked from endpoint', () => {
            const conferenceId = '1234567';
            const endpoint = { id: '1232323', displayName: 'DispName1' } as VHEndpoint;
            const action = ConferenceActions.unlinkParticipantFromEndpoint({ conferenceId, endpoint: endpoint.displayName });
            const loggedInParticipant = { status: ParticipantStatus.InHearing, role: Role.Individual } as VHParticipant;
            const activeConference = { id: conferenceId } as VHConference;

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, activeConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            actions$ = hot('-a-', { a: action });

            effects.endpointUnlinked$.subscribe(() => {
                expect(toastNotificationService.showEndpointUnlinked).toHaveBeenCalledWith(endpoint.displayName, true);
            });
        });

        it('should not call showEndpointUnlinked when conference id does not match', () => {
            const conferenceId = '1234567';
            const endpoint = { id: '1232323', displayName: 'DispName1' } as VHEndpoint;
            const action = ConferenceActions.unlinkParticipantFromEndpoint({ conferenceId, endpoint: endpoint.displayName });
            const loggedInParticipant = { status: ParticipantStatus.InHearing, role: Role.Individual } as VHParticipant;
            const activeConference = { id: '123' } as VHConference;

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, activeConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            actions$ = hot('-a-', { a: action });

            effects.endpointUnlinked$.subscribe(() => {
                expect(toastNotificationService.showEndpointUnlinked).toHaveBeenCalledTimes(0);
            });
        });
    });

    describe('closeConsultationBetweenEndpointAndParticipant$', () => {
        beforeEach(() => {
            mockConferenceStore.resetSelectors();
        });

        it('should call showEndpointConsultationClosed when consultation is closed between endpoint and participant', () => {
            const loggedInParticipant = vhConference.participants.find(x => x.role === Role.Representative);
            loggedInParticipant.status = ParticipantStatus.Available;
            const action = ConferenceActions.closeConsultationBetweenEndpointAndParticipant({
                conferenceId: vhConference.id,
                endpoint: vhConference.endpoints[0].displayName
            });

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            actions$ = hot('-a-', { a: action });

            effects.closeConsultationBetweenEndpointAndParticipant$.subscribe(() => {
                expect(toastNotificationService.showEndpointConsultationClosed).toHaveBeenCalledWith(
                    vhConference.endpoints[0].displayName,
                    false
                );
            });
        });

        it('should not call showEndpointConsultationClosed when conference id does not match', () => {
            const loggedInParticipant = vhConference.participants.find(x => x.role === Role.Representative);
            loggedInParticipant.status = ParticipantStatus.Available;
            const action = ConferenceActions.closeConsultationBetweenEndpointAndParticipant({
                conferenceId: '1234567',
                endpoint: vhConference.endpoints[0].displayName
            });

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            actions$ = hot('-a-', { a: action });

            effects.closeConsultationBetweenEndpointAndParticipant$.subscribe(() => {
                expect(toastNotificationService.showEndpointConsultationClosed).toHaveBeenCalledTimes(0);
            });
        });
    });

    describe('hearingLayoutChanged$', () => {
        beforeEach(() => {
            mockConferenceStore.resetSelectors();
        });

        it('should call showHearingLayoutchanged when hearing layout is changed by another host', () => {
            const loggedInParticipant = vhConference.participants.find(x => x.role === Role.Judge);
            const staffMember = vhConference.participants.find(x => x.role === Role.StaffMember);
            const action = ConferenceActions.hearingLayoutChanged({
                conferenceId: vhConference.id,
                changedById: staffMember.id,
                newHearingLayout: HearingLayout.Dynamic,
                oldHearingLayout: HearingLayout.OnePlus7
            });

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            actions$ = hot('-a-', { a: action });

            effects.hearingLayoutChanged$.subscribe(() => {
                expect(toastNotificationService.showHearingLayoutchanged).toHaveBeenCalled();
            });
        });

        it('should not call showHearingLayoutchanged when hearing layout is changed by non-host', () => {
            const loggedInParticipant = vhConference.participants.find(x => x.role === Role.Individual);
            const staffMember = vhConference.participants.find(x => x.role === Role.StaffMember);
            const action = ConferenceActions.hearingLayoutChanged({
                conferenceId: vhConference.id,
                changedById: staffMember.id,
                newHearingLayout: HearingLayout.Dynamic,
                oldHearingLayout: HearingLayout.OnePlus7
            });

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            actions$ = hot('-a-', { a: action });

            effects.hearingLayoutChanged$.subscribe(() => {
                expect(toastNotificationService.showHearingLayoutchanged).toHaveBeenCalledTimes(0);
            });
        });

        it('should not call showHearingLayoutchanged when hearing layout is changed by same host', () => {
            const loggedInParticipant = vhConference.participants.find(x => x.role === Role.StaffMember);
            const action = ConferenceActions.hearingLayoutChanged({
                conferenceId: vhConference.id,
                changedById: loggedInParticipant.id,
                newHearingLayout: HearingLayout.Dynamic,
                oldHearingLayout: HearingLayout.OnePlus7
            });

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            actions$ = hot('-a-', { a: action });

            effects.hearingLayoutChanged$.subscribe(() => {
                expect(toastNotificationService.showHearingLayoutchanged).toHaveBeenCalledTimes(0);
            });
        });
        //     const conferenceId = '1234567';
        //     const action = ConferenceActions.hearingLayoutChanged({
        //         conferenceId,
        //         changedById: '123',
        //         newHearingLayout: HearingLayout.Dynamic,
        //         oldHearingLayout: HearingLayout.OnePlus7
        //     });
        //     const loggedInParticipant = { status: ParticipantStatus.InHearing, role: Role.Judge } as VHParticipant;
        //     const activeConference = { id: '123' } as VHConference;

        //     mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, activeConference);
        //     mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

        //     actions$ = hot('-a-', { a: action });

        //     effects.hearingLayoutChanged$.subscribe(() => {
        //         expect(toastNotificationService.showHearingLayoutchanged).toHaveBeenCalledTimes(0);
        //     });
        // });

        // it('should not call showHearingLayoutchanged when changedById matches loggedInParticipant', () => {
        //     const conferenceId = '1234567';
        //     const loggedInParticipant = vhConference.participants.find(x => x.role === Role.Judge);
        //     const action = ConferenceActions.hearingLayoutChanged({
        //         conferenceId,
        //         changedById: loggedInParticipant.id,
        //         newHearingLayout: HearingLayout.Dynamic,
        //         oldHearingLayout: HearingLayout.OnePlus7
        //     });
        //     const activeConference = { id: conferenceId } as VHConference;

        //     mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, activeConference);
        //     mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

        //     actions$ = hot('-a-', { a: action });

        //     effects.hearingLayoutChanged$.subscribe(() => {
        //         expect(toastNotificationService.showHearingLayoutchanged).toHaveBeenCalledTimes(0);
        //     });
        // });
    });

    describe('isVideoOn', () => {
        it('should return true when participant status is in hearing', () => {
            const status = ParticipantStatus.InHearing;
            const result = effects.isVideoOn(status);
            expect(result).toBeTrue();
        });

        it('should return false when participant status is not in hearing', () => {
            const status = ParticipantStatus.Available;
            const result = effects.isVideoOn(status);
            expect(result).toBeFalse();
        });

        it('should return true when participant status is in consultation', () => {
            const status = ParticipantStatus.InConsultation;
            const result = effects.isVideoOn(status);
            expect(result).toBeTrue();
        });
    });
});
