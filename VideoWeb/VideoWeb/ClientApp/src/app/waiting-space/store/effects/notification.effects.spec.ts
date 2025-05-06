import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable } from 'rxjs';
import { NotificationEffects } from './notification.effects';
import { ConferenceActions } from '../actions/conference.actions';
import { NotificationToastrService } from '../../services/notification-toastr.service';
import { ConferenceState } from '../reducers/conference.reducer';
import * as ConferenceSelectors from '../selectors/conference.selectors';
import { ConferenceStatus, HearingLayout, LinkType, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { mapConferenceToVHConference } from '../models/api-contract-to-state-model-mappers';
import { createMockStore, MockStore, provideMockStore } from '@ngrx/store/testing';
import { hot } from 'jasmine-marbles';
import { VHConference, VHEndpoint, VHParticipant } from '../models/vh-conference';
import { TransferDirection } from 'src/app/services/models/hearing-transfer';
import { NotificationSoundsService } from '../../services/notification-sounds.service';
import { HearingRole } from '../../models/hearing-role-model';
import { VideoCallActions } from '../actions/video-call.action';
import { Logger } from 'src/app/services/logging/logger-base';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';

describe('NotificationEffects', () => {
    const testData = new ConferenceTestData();
    const conference = testData.getConferenceDetailNow();
    conference.participants.push(testData.getFullListOfPanelMembers()[0]);

    let vhConference: VHConference;

    let actions$: Observable<any>;
    let effects: NotificationEffects;
    let mockConferenceStore: MockStore<ConferenceState>;
    let toastNotificationService: jasmine.SpyObj<NotificationToastrService>;
    let notificationSoundsService: jasmine.SpyObj<NotificationSoundsService>;

    beforeEach(() => {
        toastNotificationService = jasmine.createSpyObj<NotificationToastrService>('NotificationToastrService', [
            'showParticipantLeftHearingRoom',
            'showEndpointAdded',
            'showEndpointUpdated',
            'showEndpointLinked',
            'showEndpointUnlinked',
            'showEndpointConsultationClosed',
            'showHearingLayoutchanged',
            'showHearingStarted',
            'showParticipantAdded'
        ]);

        notificationSoundsService = jasmine.createSpyObj<NotificationSoundsService>('NotificationSoundsService', [
            'playHearingAlertSound',
            'stopHearingAlertSound'
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
                { provide: NotificationToastrService, useValue: toastNotificationService },
                { provide: NotificationSoundsService, useValue: notificationSoundsService },
                { provide: Logger, useValue: new MockLogger() }
            ]
        });

        effects = TestBed.inject(NotificationEffects);
        mockConferenceStore = TestBed.inject(MockStore);
    });

    afterAll(() => {
        mockConferenceStore.resetSelectors();
    });

    describe('hearingStartedByAnotherHost$', () => {
        beforeEach(() => {
            mockConferenceStore.resetSelectors();
        });

        it('should show hearing started notification for host participants in a consultation when hearing has started', () => {
            // arrange
            const loggedInParticipant = vhConference.participants.find(x => x.role === Role.Judge);
            loggedInParticipant.status = ParticipantStatus.InConsultation;
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            // act
            const action = ConferenceActions.updateActiveConferenceStatus({
                conferenceId: vhConference.id,
                status: ConferenceStatus.InSession
            });
            actions$ = hot('-a', { a: action });

            // assert
            effects.hearingStartedByAnotherHost$.subscribe(() => {
                expect(toastNotificationService.showHearingStarted).toHaveBeenCalled();
            });
        });
    });

    describe('participantLeaveHearingRoomSuccess$', () => {
        beforeEach(() => {
            mockConferenceStore.resetSelectors();
        });
        it('should show participant left hearing room notification for host participants when active conference matches conference id', () => {
            // arrange
            const vhParticipant = vhConference.participants.find(x => x.role === Role.Individual);
            const loggedInParticipant = vhConference.participants.find(x => x.role === Role.Judge);

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            // act
            const action = VideoCallActions.participantLeaveHearingRoomSuccess({
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
            const vhParticipant = vhConference.participants.find(x => x.role === Role.Individual);
            const loggedInParticipant = vhConference.participants.find(x => x.role !== Role.Judge);

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            // act
            const action = VideoCallActions.participantLeaveHearingRoomSuccess({
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
            const vhParticipant = vhConference.participants.find(x => x.role === Role.Individual);
            const loggedInParticipant = vhConference.participants.find(x => x.role !== Role.Judge);

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            // act
            const action = VideoCallActions.participantLeaveHearingRoomSuccess({
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

    describe('participantAdded$', () => {
        beforeEach(() => {
            mockConferenceStore.resetSelectors();
        });

        it('should show participant added notification for host participants when active conference matches conference id', () => {
            // arrange
            const loggedInParticipant = vhConference.participants.find(x => x.role === Role.Judge);
            const participants = vhConference.participants;
            const newParticipant = { id: '1234567', role: Role.Individual } as VHParticipant;
            const updatedParticipants = [...participants, newParticipant];
            effects.previousParticipants = participants;
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getParticipants, updatedParticipants);

            // act
            const action = ConferenceActions.updateParticipantList({
                conferenceId: vhConference.id,
                participants: updatedParticipants
            });
            actions$ = hot('-a', { a: action });

            // assert
            effects.participantAdded$.subscribe(() => {
                expect(toastNotificationService.showParticipantAdded).toHaveBeenCalledWith(newParticipant, jasmine.any(Boolean));
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

            const updatedEndpoints = [
                { id: '1232323', displayName: 'DispName1 Updated' } as VHEndpoint,
                { id: '2356789', displayName: 'DispName2 Updated' } as VHEndpoint
            ];
            const action = ConferenceActions.updateExistingEndpoints({ conferenceId, endpoints: updatedEndpoints });
            const loggedInParticipant = { status: ParticipantStatus.InHearing, role: Role.Individual } as VHParticipant;
            const activeConference = { id: conferenceId } as VHConference;

            effects.previousEndpoints = endpoints;
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, activeConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getEndpoints, endpoints);

            actions$ = hot('-a-', { a: action });

            effects.endpointsUpdated$.subscribe(() => {
                expect(toastNotificationService.showEndpointUpdated).toHaveBeenCalledWith(updatedEndpoints[0], true);
                expect(toastNotificationService.showEndpointUpdated).toHaveBeenCalledWith(updatedEndpoints[1], true);
            });
        });

        it('should not call showEndpointUpdated when endpoints have not changed', () => {
            const conferenceId = '1234567';
            const endpoints = [
                { id: '1232323', displayName: 'DispName1', participantsLinked: [] } as VHEndpoint,
                { id: '2356789', displayName: 'DispName2', participantsLinked: [] } as VHEndpoint
            ];
            effects.previousEndpoints = endpoints;
            const action = ConferenceActions.updateExistingEndpoints({ conferenceId, endpoints });
            const loggedInParticipant = { status: ParticipantStatus.InHearing, role: Role.Individual } as VHParticipant;
            const activeConference = { id: conferenceId } as VHConference;

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, activeConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getEndpoints, endpoints);

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
    });

    describe('participantTransferringIn$', () => {
        beforeEach(() => {
            mockConferenceStore.resetSelectors();
        });

        it('should call showParticipantTransferringIn when participant is transferring in', () => {
            const loggedInParticipant = vhConference.participants.find(x => x.role === Role.Individual);
            const action = ConferenceActions.updateParticipantHearingTransferStatus({
                conferenceId: vhConference.id,
                transferDirection: TransferDirection.In,
                participantId: loggedInParticipant.id
            });

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            actions$ = hot('-a-', { a: action });

            effects.participantTransferringIn$.subscribe(() => {
                expect(notificationSoundsService.playHearingAlertSound).toHaveBeenCalled();
            });
        });

        it('should not call showParticipantTransferringIn when participant is transferring out', () => {
            const loggedInParticipant = vhConference.participants.find(x => x.role === Role.Individual);
            const action = ConferenceActions.updateParticipantHearingTransferStatus({
                conferenceId: vhConference.id,
                transferDirection: TransferDirection.Out,
                participantId: loggedInParticipant.id
            });

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            actions$ = hot('-a-', { a: action });

            effects.participantTransferringIn$.subscribe(() => {
                expect(notificationSoundsService.playHearingAlertSound).toHaveBeenCalledTimes(0);
            });
        });

        it('should not call showParticipantTransferringIn when participant is not the logged in participant', () => {
            const loggedInParticipant = vhConference.participants.find(x => x.role === Role.Individual);
            const action = ConferenceActions.updateParticipantHearingTransferStatus({
                conferenceId: vhConference.id,
                transferDirection: TransferDirection.In,
                participantId: '1234567'
            });

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            actions$ = hot('-a-', { a: action });

            effects.participantTransferringIn$.subscribe(() => {
                expect(notificationSoundsService.playHearingAlertSound).toHaveBeenCalledTimes(0);
            });
        });
    });

    describe('hearingStartingJudicialOfficeHolder$', () => {
        beforeEach(() => {
            notificationSoundsService.playHearingAlertSound.calls.reset();
            notificationSoundsService.stopHearingAlertSound.calls.reset();
        });
        it('should play hearing alert sound when participant is judicial office holder', () => {
            const participant = vhConference.participants.find(x => x.role === Role.JudicialOfficeHolder);
            const action = ConferenceActions.updateActiveConferenceStatus({
                conferenceId: vhConference.id,
                status: ConferenceStatus.InSession
            });

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);

            actions$ = hot('-a-', { a: action });

            effects.hearingStartingJudicialOfficeHolder$.subscribe(() => {
                expect(notificationSoundsService.playHearingAlertSound).toHaveBeenCalled();
                expect(notificationSoundsService.stopHearingAlertSound).not.toHaveBeenCalled();
            });
        });

        it('should not play hearing alert sound when hearing is not in session', () => {
            const participant = vhConference.participants.find(x => x.role === Role.JudicialOfficeHolder);
            const action = ConferenceActions.updateActiveConferenceStatus({
                conferenceId: vhConference.id,
                status: ConferenceStatus.Paused
            });

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);

            actions$ = hot('-a-', { a: action });

            effects.hearingStartingJudicialOfficeHolder$.subscribe(() => {
                expect(notificationSoundsService.playHearingAlertSound).not.toHaveBeenCalled();
                expect(notificationSoundsService.stopHearingAlertSound).toHaveBeenCalled();
            });
        });
    });

    describe('hearingStartingNonJudicialOfficeHolder$', () => {
        it('should play hearing alert sound for an individual participant and hearing in session', () => {
            const participant = vhConference.participants.find(x => x.role === Role.Individual);
            const action = ConferenceActions.updateActiveConferenceStatus({
                conferenceId: vhConference.id,
                status: ConferenceStatus.InSession
            });

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);

            actions$ = hot('-a-', { a: action });

            effects.hearingStartingNonJudicialOfficeHolder$.subscribe(() => {
                expect(notificationSoundsService.playHearingAlertSound).toHaveBeenCalled();
                expect(notificationSoundsService.stopHearingAlertSound).not.toHaveBeenCalled();
            });
        });

        it('should not play hearing alert sound for an individual participant and hearing not in session', () => {
            const participant = vhConference.participants.find(x => x.role === Role.Individual);
            const action = ConferenceActions.updateActiveConferenceStatus({
                conferenceId: vhConference.id,
                status: ConferenceStatus.Paused
            });

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);

            actions$ = hot('-a-', { a: action });

            effects.hearingStartingNonJudicialOfficeHolder$.subscribe(() => {
                expect(notificationSoundsService.playHearingAlertSound).not.toHaveBeenCalled();
                expect(notificationSoundsService.stopHearingAlertSound).toHaveBeenCalled();
            });
        });

        it('should play hearing alert sound for a rep participant and hearing in session', () => {
            const participant = vhConference.participants.find(x => x.role === Role.Representative);
            const action = ConferenceActions.updateActiveConferenceStatus({
                conferenceId: vhConference.id,
                status: ConferenceStatus.InSession
            });

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);

            actions$ = hot('-a-', { a: action });

            effects.hearingStartingNonJudicialOfficeHolder$.subscribe(() => {
                expect(notificationSoundsService.playHearingAlertSound).toHaveBeenCalled();
                expect(notificationSoundsService.stopHearingAlertSound).not.toHaveBeenCalled();
            });
        });

        it('should not play hearing alert sound for a rep participant and hearing not in session', () => {
            const participant = vhConference.participants.find(x => x.role === Role.Representative);
            const action = ConferenceActions.updateActiveConferenceStatus({
                conferenceId: vhConference.id,
                status: ConferenceStatus.Paused
            });

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);

            actions$ = hot('-a-', { a: action });

            effects.hearingStartingNonJudicialOfficeHolder$.subscribe(() => {
                expect(notificationSoundsService.playHearingAlertSound).not.toHaveBeenCalled();
                expect(notificationSoundsService.stopHearingAlertSound).toHaveBeenCalled();
            });
        });

        it('should not play hearing alert sound for a participant linked to a witness', () => {
            let participant = vhConference.participants.find(x => x.role === Role.Representative);
            let secondParticipant = vhConference.participants.find(x => x.role === Role.Individual);
            secondParticipant.hearingRole = HearingRole.WITNESS;

            participant = {
                ...participant,
                linkedParticipants: [{ linkedId: secondParticipant.id, linkedType: LinkType.Interpreter }]
            } as VHParticipant;

            secondParticipant = {
                ...secondParticipant,
                linkedParticipants: [{ linkedId: participant.id, linkedType: LinkType.Interpreter }]
            } as VHParticipant;

            vhConference.participants = [participant, secondParticipant];
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);

            const action = ConferenceActions.updateActiveConferenceStatus({
                conferenceId: vhConference.id,
                status: ConferenceStatus.InSession
            });

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);

            actions$ = hot('-a-', { a: action });

            effects.hearingStartingNonJudicialOfficeHolder$.subscribe(() => {
                expect(notificationSoundsService.playHearingAlertSound).not.toHaveBeenCalled();
                expect(notificationSoundsService.stopHearingAlertSound).toHaveBeenCalled();
            });
        });

        it('should not play hearing alert for a quick link participant', () => {
            const participant = vhConference.participants.find(x => x.role === Role.Individual);
            participant.hearingRole = HearingRole.QUICK_LINK_PARTICIPANT;

            const action = ConferenceActions.updateActiveConferenceStatus({
                conferenceId: vhConference.id,
                status: ConferenceStatus.InSession
            });

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);

            actions$ = hot('-a-', { a: action });

            effects.hearingStartingNonJudicialOfficeHolder$.subscribe(() => {
                expect(notificationSoundsService.playHearingAlertSound).not.toHaveBeenCalled();
                expect(notificationSoundsService.stopHearingAlertSound).toHaveBeenCalled();
            });
        });

        it('should not play hearing alert for a quick link observer', () => {
            const participant = vhConference.participants.find(x => x.role === Role.Individual);
            participant.hearingRole = HearingRole.QUICK_LINK_OBSERVER;

            const action = ConferenceActions.updateActiveConferenceStatus({
                conferenceId: vhConference.id,
                status: ConferenceStatus.InSession
            });

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, participant);

            actions$ = hot('-a-', { a: action });

            effects.hearingStartingNonJudicialOfficeHolder$.subscribe(() => {
                expect(notificationSoundsService.playHearingAlertSound).not.toHaveBeenCalled();
                expect(notificationSoundsService.stopHearingAlertSound).toHaveBeenCalled();
            });
        });
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
