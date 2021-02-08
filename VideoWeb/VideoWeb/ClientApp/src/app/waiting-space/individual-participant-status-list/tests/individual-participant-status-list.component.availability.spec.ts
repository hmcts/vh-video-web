import { ActivatedRoute } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    ConferenceStatus,
    LoggedParticipantResponse,
    EndpointStatus,
    ParticipantResponse,
    ParticipantResponseVho,
    ParticipantStatus,
    Role,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { Participant } from 'src/app/shared/models/participant';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { consultationServiceSpyFactory } from 'src/app/testing/mocks/mock-consultation-service';
import { eventsServiceSpy, participantStatusSubjectMock } from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { IndividualParticipantStatusListComponent } from '../individual-participant-status-list.component';

describe('IndividualParticipantStatusListComponent Participant Status and Availability', () => {
    let component: IndividualParticipantStatusListComponent;
    let adalService: jasmine.SpyObj<AdalService>;
    let consultationService: jasmine.SpyObj<ConsultationService>;
    const eventsService = eventsServiceSpy;
    const participantStatusSubject = participantStatusSubjectMock;
    const logger: Logger = new MockLogger();
    let videoWebService: jasmine.SpyObj<VideoWebService>;

    let conference: ConferenceResponse;
    let participantsObserverPanelMember: ParticipantResponseVho[];
    let participantsWinger: ParticipantResponseVho[];
    let activatedRoute: ActivatedRoute;
    let logged: LoggedParticipantResponse;
    beforeAll(() => {
        conference = new ConferenceTestData().getConferenceDetailFuture();
        const testParticipant = conference.participants.filter(x => x.role === Role.Individual)[0];
        participantsObserverPanelMember = new ConferenceTestData().getListOfParticipantsObserverAndPanelMembers();
        participantsWinger = new ConferenceTestData().getListOfParticipantsWingers();

        adalService = jasmine.createSpyObj<AdalService>('AdalService', ['init', 'handleWindowCallback', 'userInfo', 'logOut'], {
            userInfo: <adal.User>{ userName: 'test@test.test', authenticated: true }
        });

        consultationService = consultationServiceSpyFactory();

        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getObfuscatedName']);
        videoWebService.getObfuscatedName.and.returnValue('t***** u*****');
        logged = new LoggedParticipantResponse({
            participant_id: conference.participants[2].id,
            display_name: 'Jonh Doe',
            role: Role.Judge
        });
    });

    beforeEach(() => {
        activatedRoute = <any>{
            snapshot: { data: { loggedUser: logged } }
        };

        consultationService.clearModals.calls.reset();
        component = new IndividualParticipantStatusListComponent(
            adalService,
            consultationService,
            eventsService,
            logger,
            videoWebService,
            activatedRoute
        );
        conference = new ConferenceTestData().getConferenceDetailFuture();
        component.conference = conference;
        component.loggedInUser = new LoggedParticipantResponse({
            participant_id: conference.participants[2].id,
            display_name: 'Jonh Doe',
            role: Role.Judge
        });
        component.setupSubscribers();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    const participantStatusTestCases = [
        { status: ParticipantStatus.Available, expected: 'Available' },
        { status: ParticipantStatus.InConsultation, expected: 'Unavailable' },
        { status: ParticipantStatus.InHearing, expected: 'Unavailable' },
        { status: ParticipantStatus.Disconnected, expected: 'Unavailable' },
        { status: ParticipantStatus.Joining, expected: 'Unavailable' },
        { status: ParticipantStatus.NotSignedIn, expected: 'Unavailable' },
        { status: ParticipantStatus.None, expected: 'Unavailable' }
    ];

    participantStatusTestCases.forEach(test => {
        it(`should return text "${test.expected}" when participant status is ${test.status}`, () => {
            const pat = component.conference.participants[0];
            pat.status = test.status;
            expect(component.getParticipantStatusText(pat)).toBe(test.expected);
        });
    });

    it('should not be able to call participant is user is judge', () => {
        const judge = component.conference.participants.find(x => x.role === Role.Judge);
        component.loggedInUser.participant_id = judge.id;
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, id: '12345' });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call an unavailable participant', () => {
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, id: '12345' });
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
        const participant = new ParticipantResponse({ status: ParticipantStatus.Available, id: '12345' });
        expect(component.canCallParticipant(participant)).toBeTruthy();
    });

    it('should not be able to call endpoint when hearing is about to start', () => {
        component.conference = new ConferenceTestData().getConferenceDetailNow();
        const endpoint = new VideoEndpointResponse({
            status: EndpointStatus.Connected,
            defence_advocate_username: adalService.userInfo.userName
        });
        expect(component.canCallEndpoint(endpoint)).toBeFalsy();
    });

    it('should not be able to call endpoint when hearing is delayed', () => {
        component.conference = new ConferenceTestData().getConferenceDetailPast();
        const endpoint = new VideoEndpointResponse({
            status: EndpointStatus.Connected,
            defence_advocate_username: adalService.userInfo.userName
        });
        expect(component.canCallEndpoint(endpoint)).toBeFalsy();
    });

    it('should not be able to call endpoint when hearing is suspended', () => {
        component.conference.status = ConferenceStatus.Suspended;
        const endpoint = new VideoEndpointResponse({
            status: EndpointStatus.Connected,
            defence_advocate_username: adalService.userInfo.userName
        });
        expect(component.canCallEndpoint(endpoint)).toBeFalsy();
    });

    it('should not be able to call endpoint that has no defence advocate', () => {
        const endpoint = new VideoEndpointResponse({
            status: EndpointStatus.Connected
        });
        expect(component.canCallEndpoint(endpoint)).toBeFalsy();
    });

    it('should not be able to call endpoint linked to another defence advocate', () => {
        const endpoint = new VideoEndpointResponse({
            status: EndpointStatus.Connected,
            defence_advocate_username: 'another@test.com'
        });
        expect(component.canCallEndpoint(endpoint)).toBeFalsy();
    });

    it('should be able to call an available endpoint', () => {
        const endpoint = new VideoEndpointResponse({
            status: EndpointStatus.Connected,
            defence_advocate_username: adalService.userInfo.userName
        });
        expect(component.canCallEndpoint(endpoint)).toBeTruthy();
    });

    const handleParticipantStatus = [
        { status: ParticipantStatus.Available },
        { status: ParticipantStatus.InHearing },
        { status: ParticipantStatus.Disconnected },
        { status: ParticipantStatus.Joining },
        { status: ParticipantStatus.NotSignedIn },
        { status: ParticipantStatus.None }
    ];

    handleParticipantStatus.forEach(test => {
        it(`should take no action user receives participant status message with status ${test.status}`, () => {
            const participant = component.conference.participants.filter(x => x.role === Role.Individual)[0];
            const payload = new ParticipantStatusMessage(participant.id, '', conference.id, test.status);

            participantStatusSubject.next(payload);
            expect(consultationService.clearModals).toHaveBeenCalledTimes(0);
        });
    });

    it('should close all modals user receives in consultation message', () => {
        const participant = component.conference.participants.filter(x => x.id === component.loggedInUser.participant_id)[0];

        const payload = new ParticipantStatusMessage(participant.id, '', conference.id, ParticipantStatus.InConsultation);

        participantStatusSubject.next(payload);
        expect(consultationService.clearModals).toHaveBeenCalledTimes(1);
    });

    it('should show observers, panel members, endpoints, wingers and participants', () => {
        participantsObserverPanelMember.forEach(x => {
            component.conference.participants.push(x);
        });
        participantsWinger.forEach(x => {
            component.conference.participants.push(x);
        });
        const endpoints = new ConferenceTestData().getListOfEndpoints();
        conference.endpoints = endpoints;
        component.ngOnInit();

        expect(component.nonJudgeParticipants).toBeDefined();
        expect(component.nonJudgeParticipants.length).toBe(2);

        expect(component.observers).toBeDefined();
        expect(component.observers.length).toBe(2);
        expect(component.panelMembers).toBeDefined();
        expect(component.panelMembers.length).toBe(1);

        expect(component.wingers).toBeDefined();
        expect(component.wingers.length).toBe(1);

        expect(component.participantCount).toBe(6);
        expect(component.endpoints).toBeDefined();
        expect(component.endpoints.length).toBe(2);
    });
    it('should return true if case type is none', () => {
        const participants = component.conference.participants;
        const participant = participants[0];
        participant.case_type_group = 'None';
        const isCaseTypeNone = component.isCaseTypeNone(participant);
        expect(isCaseTypeNone).toBe(true);
    });
    it('should return false if case type is not none', () => {
        const participants = component.conference.participants;
        const participant = participants[0];
        const isCaseTypeNone = component.isCaseTypeNone(participant);
        expect(isCaseTypeNone).toBe(false);
    });
});
