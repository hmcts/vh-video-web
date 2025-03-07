import { createMockStore, MockStore, provideMockStore } from '@ngrx/store/testing';
import { Observable } from 'rxjs';
import { ConferenceState } from '../reducers/conference.reducer';
import { NotificationToastrService } from '../../services/notification-toastr.service';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { ConsultationInvitation, ConsultationInvitationService } from '../../services/consultation-invitation.service';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { VHConference } from '../models/vh-conference';
import { mapConferenceToVHConference } from '../models/api-contract-to-state-model-mappers';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { ConsultationEffects } from './consultation.effects';
import { ConsultationAnswer, Role } from 'src/app/services/clients/api-client';
import { getTestScheduler, hot } from 'jasmine-marbles';
import { ConferenceActions } from '../actions/conference.actions';
import * as ConferenceSelectors from '../selectors/conference.selectors';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';

describe('ConsultationEffects', () => {
    const testData = new ConferenceTestData();
    const conference = testData.getConferenceDetailNow();
    conference.participants.push(testData.getFullListOfPanelMembers()[0]);

    let vhConference: VHConference;

    let actions$: Observable<any>;
    let effects: ConsultationEffects;
    let notificationToastrService: jasmine.SpyObj<NotificationToastrService>;
    let consultationService: jasmine.SpyObj<ConsultationService>;
    let consultationInvitationService: jasmine.SpyObj<ConsultationInvitationService>;
    let mockConferenceStore: MockStore<ConferenceState>;

    beforeEach(() => {
        notificationToastrService = jasmine.createSpyObj<NotificationToastrService>('NotificationToastrService', [
            'showConsultationInvite'
        ]);
        consultationService = jasmine.createSpyObj<ConsultationService>('ConsultationService', ['respondToConsultationRequest']);
        consultationInvitationService = jasmine.createSpyObj<ConsultationInvitationService>('ConsultationInvitationService', [
            'getInvitation'
        ]);

        vhConference = mapConferenceToVHConference(conference);
        mockConferenceStore = createMockStore({
            initialState: { currentConference: vhConference, availableRooms: [] }
        });

        TestBed.configureTestingModule({
            providers: [
                ConsultationEffects,
                provideMockStore(),
                provideMockActions(() => actions$),
                { provide: ConsultationService, useValue: consultationService },
                { provide: ConsultationInvitationService, useValue: consultationInvitationService },
                { provide: NotificationToastrService, useValue: notificationToastrService }
            ]
        });

        effects = TestBed.inject(ConsultationEffects);
        mockConferenceStore = TestBed.inject(MockStore);
    });

    afterAll(() => {
        mockConferenceStore.resetSelectors();
    });

    describe('consultationResponded$', () => {
        beforeEach(() => {
            mockConferenceStore.resetSelectors();
        });

        it('should dispatch clearConsultationCallStatus after 10 seconds when consultationResponded is dispatched', () => {
            const action = ConferenceActions.consultationResponded({
                conferenceId: 'conferenceId',
                invitationId: 'invitationId',
                roomLabel: 'roomLabel',
                requestedFor: 'requestedFor',
                answer: ConsultationAnswer.Accepted,
                responseInitiatorId: 'responseInitiatorId'
            });
            const result = ConferenceActions.clearConsultationCallStatus({
                invitationId: 'invitationId',
                requestedFor: 'requestedFor'
            });

            const scheduler = getTestScheduler();
            scheduler.run(helpers => {
                actions$ = helpers.hot('-a', { a: action });
                helpers.expectObservable(effects.consultationResponded$).toBe('- 10s b', { b: result });
            });
        });
    });

    describe('getRequestedConsultationMessage$', () => {
        beforeEach(() => {
            mockConferenceStore.resetSelectors();
        });

        it('should invoke consultation service with answer Accepted if the invitation has already been accepted', () => {
            const requestedBy = vhConference.participants.find(x => x.role === Role.Representative);
            const requestedFor = vhConference.participants.find(x => x.role === Role.Individual);
            const loggedInParticipant = requestedFor;
            const invitationId = 'invitationId1';
            const roomLabel = 'ParticipantConsultationRoom1';

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            consultationInvitationService.getInvitation.withArgs(roomLabel).and.returnValue({
                invitationId,
                roomLabel,
                invitedByName: requestedBy.displayName,
                answer: ConsultationAnswer.Accepted,
                linkedParticipantStatuses: {},
                activeToast: null
            });

            const action = ConferenceActions.consultationRequested({
                conferenceId: vhConference.id,
                requestedBy: requestedBy.id,
                requestedFor: requestedFor.id,
                roomLabel: roomLabel,
                invitationId
            });

            actions$ = hot('-a', { a: action });

            effects.getRequestedConsultationMessage$.subscribe(() => {
                expect(consultationService.respondToConsultationRequest).toHaveBeenCalledWith(
                    vhConference.id,
                    invitationId,
                    requestedBy.id,
                    requestedFor.id,
                    ConsultationAnswer.Accepted,
                    roomLabel
                );
            });
        });

        it('should add linked participants to the invitation', () => {
            const requestedBy = vhConference.participants.find(x => x.role === Role.Judge);
            const requestedFor = vhConference.participants.find(x => x.role === Role.Representative);
            const linkedParticipant = vhConference.participants.find(x => x.role === Role.Individual);

            requestedFor.linkedParticipants = [{ linkedId: linkedParticipant.id }];

            const loggedInParticipant = requestedFor;
            const invitationId = 'invitationId1';
            const roomLabel = 'ParticipantConsultationRoom2';

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            const invitation: ConsultationInvitation = {
                invitationId,
                roomLabel,
                invitedByName: requestedBy.displayName,
                answer: ConsultationAnswer.None,
                linkedParticipantStatuses: {},
                activeToast: null
            };
            consultationInvitationService.getInvitation.withArgs(roomLabel).and.returnValue(invitation);

            const action = ConferenceActions.consultationRequested({
                conferenceId: vhConference.id,
                requestedBy: requestedBy.id,
                requestedFor: requestedFor.id,
                roomLabel: roomLabel,
                invitationId
            });

            actions$ = hot('-a', { a: action });

            effects.getRequestedConsultationMessage$.subscribe(() => {
                expect(invitation.linkedParticipantStatuses).toEqual({
                    [linkedParticipant.id]: false
                });
            });
        });

        it('should not set the linked participant status the linked participant is already on the invite already exists', () => {
            const requestedBy = vhConference.participants.find(x => x.role === Role.Judge);
            const requestedFor = vhConference.participants.find(x => x.role === Role.Representative);
            const linkedParticipant = vhConference.participants.find(x => x.role === Role.Individual);

            requestedFor.linkedParticipants = [{ linkedId: linkedParticipant.id }];

            const loggedInParticipant = requestedFor;
            const invitationId = 'invitationId1';
            const roomLabel = 'ParticipantConsultationRoom2';

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            const invitation: ConsultationInvitation = {
                invitationId,
                roomLabel,
                invitedByName: requestedBy.displayName,
                answer: ConsultationAnswer.None,
                linkedParticipantStatuses: {
                    [linkedParticipant.id]: true
                },
                activeToast: null
            };
            consultationInvitationService.getInvitation.withArgs(roomLabel).and.returnValue(invitation);

            const action = ConferenceActions.consultationRequested({
                conferenceId: vhConference.id,
                requestedBy: requestedBy.id,
                requestedFor: requestedFor.id,
                roomLabel: roomLabel,
                invitationId
            });

            actions$ = hot('-a', { a: action });

            effects.getRequestedConsultationMessage$.subscribe(() => {
                expect(invitation.linkedParticipantStatuses).toEqual({
                    [linkedParticipant.id]: true
                });
            });
        });

        it('should showConsultationInvite if the invitation has not been accepted', () => {
            const requestedBy = vhConference.participants.find(x => x.role === Role.Representative);
            const requestedFor = vhConference.participants.find(x => x.role === Role.Individual);
            const loggedInParticipant = requestedFor;
            const invitationId = 'invitationId1';
            const roomLabel = 'ParticipantConsultationRoom2';

            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, vhConference);
            mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            const invitation: ConsultationInvitation = {
                invitationId,
                roomLabel,
                invitedByName: requestedBy.displayName,
                answer: ConsultationAnswer.None,
                linkedParticipantStatuses: {},
                activeToast: null
            };
            consultationInvitationService.getInvitation.withArgs(roomLabel).and.returnValue(invitation);

            const expectedToast = jasmine.createSpyObj<VhToastComponent>('VhToastComponent', ['remove']);
            notificationToastrService.showConsultationInvite.and.returnValue(expectedToast);

            const action = ConferenceActions.consultationRequested({
                conferenceId: vhConference.id,
                requestedBy: requestedBy.id,
                requestedFor: requestedFor.id,
                roomLabel: roomLabel,
                invitationId
            });

            actions$ = hot('-a', { a: action });

            effects.getRequestedConsultationMessage$.subscribe(() => {
                expect(notificationToastrService.showConsultationInvite).toHaveBeenCalled();
            });
        });
    });
});
