import { ActivatedRoute } from '@angular/router';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    ConferenceStatus,
    ConsultationAnswer,
    LoggedParticipantResponse,
    EndpointStatus,
    ParticipantResponse,
    ParticipantResponseVho,
    ParticipantStatus,
    Role
} from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConsultationMessage } from 'src/app/services/models/consultation-message';
import { Participant } from 'src/app/shared/models/participant';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { consultationServiceSpyFactory } from 'src/app/testing/mocks/mock-consultation-service';
import {
    adminConsultationMessageSubjectMock,
    consultationMessageSubjectMock,
    eventsServiceSpy
} from 'src/app/testing/mocks/mock-events-service';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { CaseTypeGroup } from '../../models/case-type-group';
import { HearingRole } from '../../models/hearing-role-model';
import { IndividualParticipantStatusListComponent } from '../individual-participant-status-list.component';

describe('IndividualParticipantStatusListComponent consultations', () => {
    let component: IndividualParticipantStatusListComponent;
    let conference: ConferenceResponse;
    let consultationRequester: Participant;
    let consultationRequestee: Participant;
    let participantsObserverPanelMember: ParticipantResponseVho[];
    let participantsWinger: ParticipantResponseVho[];
    let participantsWitness: ParticipantResponseVho[];

    const mockAdalService = new MockAdalService();
    let adalService;
    let consultationService: jasmine.SpyObj<ConsultationService>;
    const eventsService = eventsServiceSpy;
    const consultationSubject = consultationMessageSubjectMock;
    const adminConsultationSubject = adminConsultationMessageSubjectMock;

    let logger: jasmine.SpyObj<Logger>;
    let videoWebService: jasmine.SpyObj<VideoWebService>;

    let timer: jasmine.SpyObj<NodeJS.Timeout>;
    const testdata = new ConferenceTestData();
    let logged: LoggedParticipantResponse;
    let activatedRoute: ActivatedRoute;

    beforeAll(() => {
        adalService = mockAdalService;

        consultationService = consultationServiceSpyFactory();

        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getObfuscatedName', 'getCurrentParticipant']);
        videoWebService.getObfuscatedName.and.returnValue('t***** u*****');

        logger = jasmine.createSpyObj<Logger>('Logger', ['debug', 'info', 'warn', 'event', 'error']);
        participantsObserverPanelMember = testdata.getListOfParticipantsObserverAndPanelMembers();
        participantsWinger = testdata.getListOfParticipantsWingers();
        participantsWitness = testdata.getListOfParticipantsWitness();
    });

    beforeEach(() => {
        conference = new ConferenceTestData().getConferenceDetailFuture();
        conference.participants.forEach(p => {
            p.status = ParticipantStatus.Available;
        });
        const judge = conference.participants.find(x => x.role === Role.Judge);

        logged = new LoggedParticipantResponse({
            participant_id: judge.id,
            display_name: judge.display_name,
            role: Role.Judge
        });
        consultationRequester = new Participant(conference.participants[0]);
        consultationRequestee = new Participant(conference.participants[1]);
        activatedRoute = <any>{
            snapshot: { data: { loggedUser: logged } }
        };

        timer = jasmine.createSpyObj<NodeJS.Timer>('NodeJS.Timer', ['ref', 'unref']);
        component = new IndividualParticipantStatusListComponent(
            adalService,
            consultationService,
            eventsService,
            logger,
            videoWebService,
            activatedRoute
        );

        component.consultationRequester = consultationRequester;
        component.consultationRequestee = consultationRequestee;
        component.conference = conference;

        videoWebService.getCurrentParticipant.and.returnValue(Promise.resolve(logged));

        component.loggedInUser = logged;
        component.setupSubscribers();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should init properties and setup ringtone on init', async () => {
        component.ngOnInit();
        expect(component).toBeTruthy();
        expect(component.judge).toBeDefined();
        expect(component.nonJudgeParticipants).toBeDefined();
        expect(component.nonJudgeParticipantsExtend).toBeDefined();
        expect(consultationService.resetWaitingForResponse).toHaveBeenCalled();
    });
    it('should set can call flag for participants', () => {
        component.nonJudgeParticipants = conference.participants.filter(
            x => x.role !== Role.Judge && x.role !== Role.JudicialOfficeHolder && x.hearing_role !== HearingRole.OBSERVER
        );
        component.extendNonJudgeParticipants();
        expect(component.nonJudgeParticipantsExtend.length).toBe(component.nonJudgeParticipants.length);
    });
    it('should not be able to call participant is user is judge', () => {
        const participant = new ParticipantResponse({
            status: ParticipantStatus.InConsultation,
            id: component.loggedInUser.participant_id
        });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call an unavailable participant', () => {
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, id: conference.participants[0].id });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call self', () => {
        component.conference = new ConferenceTestData().getConferenceDetailFuture();
        const participant = new ParticipantResponse({
            status: ParticipantStatus.InConsultation,
            id: component.loggedInUser.participant_id
        });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call when hearing is about to start', () => {
        const participant = new ParticipantResponse({
            status: ParticipantStatus.InConsultation,
            id: component.loggedInUser.participant_id
        });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call when hearing is delayed', () => {
        component.conference = new ConferenceTestData().getConferenceDetailPast();
        const participant = new ParticipantResponse({
            status: ParticipantStatus.InConsultation,
            id: component.loggedInUser.participant_id
        });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call when hearing is suspended', () => {
        component.conference.status = ConferenceStatus.Suspended;
        const participant = new ParticipantResponse({
            status: ParticipantStatus.InConsultation,
            id: component.loggedInUser.participant_id
        });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should be able to call an available participant', () => {
        const participant = new ParticipantResponse({ status: ParticipantStatus.Available, id: conference.participants[0].id });
        expect(component.canCallParticipant(participant)).toBeTruthy();
    });

    it('should not be able to begin call with self', async () => {
        consultationService.raiseConsultationRequest.and.callFake(() => Promise.resolve());
        const participant = conference.participants.find(x => x.id === component.loggedInUser.participant_id);
        await component.beginCallWith(participant);
        expect(consultationService.raiseConsultationRequest).toHaveBeenCalledTimes(0);
    });

    it('should be able to begin call with another participant', async () => {
        const participant = conference.participants.find(x => x.role === Role.Individual);
        participant.status = ParticipantStatus.Available;
        await component.beginCallWith(participant);
        expect(consultationService.raiseConsultationRequest).toHaveBeenCalled();
    });

    it('should log error when raising consultation request to API fails', async () => {
        const error = { error: 'failed to raise test PC' };
        consultationService.raiseConsultationRequest.and.rejectWith(error);
        const participant = conference.participants.find(x => x.role === Role.Individual);
        participant.status = ParticipantStatus.Available;
        await component.beginCallWith(participant);
        expect(logger.error.calls.mostRecent().args[0]).toContain('Failed to raise consultation request');
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
        expect(logger.error.calls.mostRecent().args[0]).toContain('Failed to raise private consultation with endpoint');
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
                component.consultationRequester.id,
                component.consultationRequestee.id,
                test.consulatationAnswer
            );
            consultationMessageSubjectMock.next(payload);
            expect(consultationService.handleConsultationResponse).toHaveBeenCalledWith(payload.result);
        });
    });

    it('should display no consultation room available modal when no room message is received', () => {
        const payload = new ConsultationMessage(
            conference.id,
            consultationRequester.id,
            consultationRequestee.id,
            ConsultationAnswer.NoRoomsAvailable
        );
        consultationSubject.next(payload);

        expect(consultationService.displayNoConsultationRoomAvailableModal).toHaveBeenCalledTimes(1);
    });

    it('should display consultation request', () => {
        component.consultationRequestee = undefined;
        component.consultationRequester = undefined;

        // this is an incoming consultation request
        const payload = new ConsultationMessage(conference.id, consultationRequester.id, consultationRequestee.id, null);
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
    it('should close all modals when user clicks close on modal', () => {
        component.closeAllPCModals();
        expect(consultationService.clearModals).toHaveBeenCalledTimes(1);
    });
    it('should not be able to call participant if user is observer', () => {
        component.conference.scheduled_date_time = new Date(new Date(Date.now()).getTime() + 31 * 60000);

        participantsObserverPanelMember.forEach(x => {
            component.conference.participants.push(x);
        });
        const observer = component.conference.participants.find(x => x.hearing_role === HearingRole.OBSERVER);
        component.loggedInUser.participant_id = observer.id;
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, id: '12345' });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });
    it('should not be able to call participant if user is panel member', () => {
        component.conference.scheduled_date_time = new Date(new Date(Date.now()).getTime() + 31 * 60000);

        participantsObserverPanelMember.forEach(x => {
            component.conference.participants.push(x);
        });
        const panelMember = component.conference.participants.find(x => x.hearing_role === HearingRole.PANEL_MEMBER);
        component.loggedInUser.participant_id = panelMember.id;
        expect(component.getConsultationRequester().id).toBe(panelMember.id);

        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, id: '12345' });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });
    it('should not be able to call participant if user is winger', () => {
        component.conference.scheduled_date_time = new Date(new Date(Date.now()).getTime() + 31 * 60000);

        participantsWinger.forEach(x => {
            component.conference.participants.push(x);
        });
        const wingerMember = component.conference.participants.find(x => x.hearing_role === HearingRole.WINGER);
        component.loggedInUser.participant_id = wingerMember.id;
        expect(component.getConsultationRequester().id).toBe(wingerMember.id);

        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, id: '12345' });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call participant if user is a witness', () => {
        component.conference.scheduled_date_time = new Date(new Date(Date.now()).getTime() + 31 * 60000);

        participantsWitness.forEach(x => {
            component.conference.participants.push(x);
        });
        const witnessMember = component.conference.participants.find(x => x.hearing_role === HearingRole.WITNESS);
        component.loggedInUser.participant_id = witnessMember.id;
        expect(component.getConsultationRequester().id).toBe(witnessMember.id);

        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, id: '1234' });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });
});
