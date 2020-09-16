import { fakeAsync, tick } from '@angular/core/testing';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    ConferenceStatus,
    ConsultationAnswer,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    RoomType,
    ParticipantResponseVho,
    EndpointStatus
} from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { AdminConsultationMessage } from 'src/app/services/models/admin-consultation-message';
import { ConsultationMessage } from 'src/app/services/models/consultation-message';
import { Participant } from 'src/app/shared/models/participant';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import {
    adminConsultationMessageSubjectMock,
    consultationMessageSubjectMock,
    eventsServiceSpy
} from 'src/app/testing/mocks/mock-events-service';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { IndividualParticipantStatusListComponent } from '../individual-participant-status-list.component';
import { CaseTypeGroup } from '../../models/case-type-group';

describe('IndividualParticipantStatusListComponent consultations', () => {
    let component: IndividualParticipantStatusListComponent;
    let conference: ConferenceResponse;
    let consultationRequester: Participant;
    let consultationRequestee: Participant;
    let participantsObserverPanelMember: ParticipantResponseVho[];

    const mockAdalService = new MockAdalService();
    let adalService;
    let consultationService: jasmine.SpyObj<ConsultationService>;
    const eventsService = eventsServiceSpy;
    const consultationSubject = consultationMessageSubjectMock;
    const adminConsultationSubject = adminConsultationMessageSubjectMock;

    let logger: jasmine.SpyObj<Logger>;
    let videoWebService: jasmine.SpyObj<VideoWebService>;

    let timer: jasmine.SpyObj<NodeJS.Timeout>;

    beforeAll(() => {
        adalService = mockAdalService;

        consultationService = jasmine.createSpyObj<ConsultationService>('ConsultationService', [
            'resetWaitingForResponse',
            'clearOutoingCallTimeout',
            'displayAdminConsultationRequest',
            'displayNoConsultationRoomAvailableModal',
            'displayIncomingPrivateConsultation',
            'raiseConsultationRequest',
            'handleConsultationResponse',
            'respondToConsultationRequest',
            'leaveConsultation',
            'respondToAdminConsultationRequest',
            'clearModals',
            'startPrivateConsulationWithEndpoint'
        ]);
        consultationService.raiseConsultationRequest.and.resolveTo();
        consultationService.respondToConsultationRequest.and.resolveTo();
        consultationService.leaveConsultation.and.resolveTo();
        consultationService.respondToAdminConsultationRequest.and.resolveTo();
        consultationService.respondToAdminConsultationRequest.and.resolveTo();
        consultationService.startPrivateConsulationWithEndpoint.and.resolveTo();

        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getObfuscatedName']);
        videoWebService.getObfuscatedName.and.returnValue('t***** u*****');

        logger = jasmine.createSpyObj<Logger>('Logger', ['debug', 'info', 'warn', 'event', 'error']);
        participantsObserverPanelMember = new ConferenceTestData().getListOfParticipantsObserverAndPanelMembers();
    });

    beforeEach(() => {
        conference = new ConferenceTestData().getConferenceDetailFuture();
        conference.participants.forEach(p => {
            p.status = ParticipantStatus.Available;
        });
        consultationRequester = new Participant(conference.participants[0]);
        consultationRequestee = new Participant(conference.participants[1]);

        timer = jasmine.createSpyObj<NodeJS.Timer>('NodeJS.Timer', ['ref', 'unref']);
        component = new IndividualParticipantStatusListComponent(adalService, consultationService, eventsService, logger, videoWebService);

        component.consultationRequester = consultationRequester;
        component.consultationRequestee = consultationRequestee;
        component.conference = conference;
        component.setupSubscribers();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should init properties and setup ringtone on init', () => {
        component.ngOnInit();
        expect(component).toBeTruthy();
        expect(component.judge).toBeDefined();
        expect(component.nonJugdeParticipants).toBeDefined();
        expect(consultationService.resetWaitingForResponse).toHaveBeenCalled();
    });

    it('should not be able to call participant is user is judge', () => {
        const judge = component.conference.participants.find(x => x.role === Role.Judge);
        adalService.userInfo.userName = judge.username;
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: 'test@dot.com' });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call an unavailable participant', () => {
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: 'test@dot.com' });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call self', () => {
        component.conference = new ConferenceTestData().getConferenceDetailFuture();
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: adalService.userInfo.userName });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call when hearing is about to start', () => {
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: adalService.userInfo.userName });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call when hearing is delayed', () => {
        component.conference = new ConferenceTestData().getConferenceDetailPast();
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: adalService.userInfo.userName });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call when hearing is suspended', () => {
        component.conference.status = ConferenceStatus.Suspended;
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: adalService.userInfo.userName });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should be able to call an available participant', () => {
        const participant = new ParticipantResponse({ status: ParticipantStatus.Available, username: 'test@dot.com' });
        expect(component.canCallParticipant(participant)).toBeTruthy();
    });

    it('should not be able to begin call with self', async () => {
        consultationService.raiseConsultationRequest.and.callFake(() => Promise.resolve());
        adalService.userInfo.userName = 'chris.green@hearings.net';
        const participant = conference.participants.find(x => x.username === adalService.userInfo.userName);
        await component.beginCallWith(participant);
        expect(consultationService.raiseConsultationRequest).toHaveBeenCalledTimes(0);
    });

    it('should be able to begin call with another participant', async () => {
        const participant = conference.participants.find(x => x.username === 'james.green@hearings.net');
        participant.status = ParticipantStatus.Available;
        await component.beginCallWith(participant);
        expect(consultationService.raiseConsultationRequest).toHaveBeenCalled();
    });

    it('should log error when raising consultation request to API fails', async () => {
        const error = { error: 'failed to raise test PC' };
        consultationService.raiseConsultationRequest.and.rejectWith(error);
        const participant = conference.participants.find(x => x.username === 'james.green@hearings.net');
        participant.status = ParticipantStatus.Available;
        await component.beginCallWith(participant);
        expect(logger.error.calls.mostRecent().args[0]).toEqual('Failed to raise consultation request');
    });

    it('should not be able to begin endpoint call', async () => {
        component.conference = new ConferenceTestData().getConferenceDetailNow();
        const endpoint = conference.endpoints[0];
        endpoint.defence_advocate_username = adalService.userInfo.userName;
        endpoint.status = EndpointStatus.Connected;
        await component.beginEndpointCallWith(endpoint);
        expect(consultationService.startPrivateConsulationWithEndpoint).toHaveBeenCalledTimes(0);
    });

    it('should be able to begin endpoint call', async () => {
        const endpoint = conference.endpoints[0];
        endpoint.defence_advocate_username = adalService.userInfo.userName;
        endpoint.status = EndpointStatus.Connected;
        await component.beginEndpointCallWith(endpoint);
        expect(consultationService.startPrivateConsulationWithEndpoint).toHaveBeenCalled();
    });

    it('should log error when endpoint call request to API fails', async () => {
        const error = { error: 'failed to raise test PC' };
        consultationService.startPrivateConsulationWithEndpoint.and.rejectWith(error);
        const endpoint = conference.endpoints[0];
        endpoint.defence_advocate_username = adalService.userInfo.userName;
        endpoint.status = EndpointStatus.Connected;
        await component.beginEndpointCallWith(endpoint);
        expect(logger.error.calls.mostRecent().args[0]).toEqual('Failed to raise private consultation with endpoint');
    });

    const getConsultationMessageTestCases = [
        { consulatationAnswer: ConsultationAnswer.Accepted },
        { consulatationAnswer: ConsultationAnswer.Rejected },
        { consulatationAnswer: ConsultationAnswer.Cancelled }
    ];

    getConsultationMessageTestCases.forEach(test => {
        it(`should call consultation service when consultation has been "${test.consulatationAnswer}"`, () => {
            const payload = new ConsultationMessage(
                conference.id,
                component.consultationRequester.username,
                component.consultationRequestee.username,
                test.consulatationAnswer
            );
            consultationMessageSubjectMock.next(payload);
            expect(consultationService.handleConsultationResponse).toHaveBeenCalledWith(payload.result);
        });
    });

    it('should display no consultation room available modal when no room message is received', () => {
        const payload = new ConsultationMessage(
            conference.id,
            consultationRequester.username,
            consultationRequestee.username,
            ConsultationAnswer.NoRoomsAvailable
        );
        consultationSubject.next(payload);

        expect(consultationService.displayNoConsultationRoomAvailableModal).toHaveBeenCalledTimes(1);
    });

    it('should display consultation request', () => {
        component.consultationRequestee = undefined;
        component.consultationRequester = undefined;

        // this is an incoming consultation request
        const payload = new ConsultationMessage(conference.id, consultationRequester.username, consultationRequestee.username, null);
        consultationSubject.next(payload);

        expect(component.consultationRequestee.id).toEqual(consultationRequestee.id);
        expect(component.consultationRequester.id).toEqual(consultationRequester.id);
        expect(consultationService.displayIncomingPrivateConsultation).toHaveBeenCalledTimes(1);
    });

    it('should answer consultation request', async () => {
        await component.answerConsultationRequest(ConsultationAnswer.Accepted);

        expect(consultationService.respondToConsultationRequest).toHaveBeenCalledWith(
            conference,
            component.consultationRequester.base,
            component.consultationRequestee.base,
            ConsultationAnswer.Accepted
        );
    });

    it('should respond to admin consultation with answer "Accepted"', async () => {
        component.consultationRequestee = new Participant(conference.participants[1]);
        const adminConsultationMessage = new AdminConsultationMessage(
            conference.id,
            RoomType.AdminRoom,
            component.consultationRequestee.username,
            null
        );
        component.adminConsultationMessage = adminConsultationMessage;

        await component.acceptVhoConsultationRequest();
        expect(consultationService.respondToAdminConsultationRequest).toHaveBeenCalledWith(
            conference,
            component.consultationRequestee.base,
            ConsultationAnswer.Accepted,
            adminConsultationMessage.roomType
        );
    });

    it('should cancel consultation when requester cancels call', async () => {
        await component.cancelConsultationRequest();

        expect(consultationService.respondToConsultationRequest).toHaveBeenCalledWith(
            component.conference,
            component.consultationRequester.base,
            component.consultationRequestee.base,
            ConsultationAnswer.Cancelled
        );
    });

    it('should log error when answering consultation request fails', async () => {
        logger.error.calls.reset();
        const error = { error: 'test error' };
        consultationService.respondToConsultationRequest.and.rejectWith(error);
        await component.answerConsultationRequest(ConsultationAnswer.Accepted);
        expect(logger.error).toHaveBeenCalled();
    });

    it('should log error when accepting VHO consultation fails', async () => {
        logger.error.calls.reset();
        const error = { error: 'test error' };
        consultationService.respondToAdminConsultationRequest.and.rejectWith(error);
        await component.acceptVhoConsultationRequest();
        expect(logger.error).toHaveBeenCalled();
    });

    it('should display VHO consultation request modal when VHO request message is received and participant is available', fakeAsync(() => {
        consultationService.displayAdminConsultationRequest.calls.reset();
        spyOn(global, 'setTimeout').and.returnValue(<any>timer);
        component.consultationRequestee = undefined;
        component.consultationRequester = undefined;

        const payload = new AdminConsultationMessage(conference.id, RoomType.AdminRoom, consultationRequestee.username, null);
        adminConsultationSubject.next(payload);
        tick();

        expect(component.consultationRequestee.id).toEqual(consultationRequestee.id);
        expect(consultationService.displayAdminConsultationRequest).toHaveBeenCalledTimes(1);
    }));

    it('should not VHO consultation request modal when VHO request message is received and participant is not available', fakeAsync(() => {
        consultationService.displayAdminConsultationRequest.calls.reset();
        spyOn(global, 'setTimeout').and.returnValue(<any>timer);
        component.consultationRequestee = undefined;
        component.consultationRequester = undefined;
        spyOn(component, 'isParticipantAvailable').and.returnValue(false);

        const payload = new AdminConsultationMessage(conference.id, RoomType.AdminRoom, consultationRequestee.username, null);
        adminConsultationSubject.next(payload);
        tick();

        expect(component.consultationRequestee).toBeUndefined();
        expect(consultationService.displayAdminConsultationRequest).toHaveBeenCalledTimes(0);
    }));

    it('should not take action when VHO consultation response message is received', fakeAsync(() => {
        consultationService.displayAdminConsultationRequest.calls.reset();
        component.consultationRequestee = undefined;
        component.consultationRequester = undefined;
        spyOn(component, 'handleAdminConsultationMessage');
        const payload = new AdminConsultationMessage(
            conference.id,
            RoomType.AdminRoom,
            consultationRequestee.username,
            ConsultationAnswer.Accepted
        );
        adminConsultationSubject.next(payload);

        expect(component.handleAdminConsultationMessage).toHaveBeenCalledTimes(0);
    }));

    it('should close all modals when user clicks close on modal', () => {
        component.closeAllPCModals();
        expect(consultationService.clearModals).toHaveBeenCalledTimes(1);
    });
    it('should not be able to call participant is user is observer', () => {
        component.conference.scheduled_date_time = new Date(new Date(Date.now()).getTime() + 31 * 60000);

        participantsObserverPanelMember.forEach(x => {
            component.conference.participants.push(x);
        });
        const observer = component.conference.participants.find(x => x.case_type_group === CaseTypeGroup.OBSERVER);
        adalService.userInfo.userName = observer.username;

        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: 'test@dot.com' });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });
    it('should not be able to call participant is user is panel member', () => {
        component.conference.scheduled_date_time = new Date(new Date(Date.now()).getTime() + 31 * 60000);

        participantsObserverPanelMember.forEach(x => {
            component.conference.participants.push(x);
        });
        const panelMember = component.conference.participants.find(x => x.case_type_group === CaseTypeGroup.PANEL_MEMBER);
        adalService.userInfo.userName = panelMember.username;

        expect(component.getConsultationRequester().username).toBe(panelMember.username);

        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: 'test@dot.com' });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });
});
