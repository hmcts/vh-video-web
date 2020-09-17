import { AdalService } from 'adal-angular4';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    ConferenceStatus,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    ParticipantResponseVho,
    VideoEndpointResponse,
    EndpointStatus
} from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { Participant } from 'src/app/shared/models/participant';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
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

    beforeAll(() => {
        conference = new ConferenceTestData().getConferenceDetailFuture();
        const testParticipant = conference.participants.filter(x => x.role === Role.Individual)[0];
        participantsObserverPanelMember = new ConferenceTestData().getListOfParticipantsObserverAndPanelMembers();

        adalService = jasmine.createSpyObj<AdalService>('AdalService', ['init', 'handleWindowCallback', 'userInfo', 'logOut'], {
            userInfo: <adal.User>{ userName: testParticipant.username, authenticated: true }
        });

        consultationService = jasmine.createSpyObj<ConsultationService>('ConsultationService', [
            'clearOutoingCallTimeout',
            'clearModals',
            'resetWaitingForResponse'
        ]);

        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getObfuscatedName']);
        videoWebService.getObfuscatedName.and.returnValue('t***** u*****');
    });

    beforeEach(() => {
        consultationService.clearModals.calls.reset();
        component = new IndividualParticipantStatusListComponent(adalService, consultationService, eventsService, logger, videoWebService);
        conference = new ConferenceTestData().getConferenceDetailFuture();
        component.consultationRequester = new Participant(conference.participants[0]);
        component.consultationRequestee = new Participant(conference.participants[1]);
        component.conference = conference;
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
            const payload = new ParticipantStatusMessage(participant.id, participant.username, conference.id, test.status);

            participantStatusSubject.next(payload);
            expect(consultationService.clearModals).toHaveBeenCalledTimes(0);
        });
    });

    it('should close all modals user receives in consultation message', () => {
        const participant = component.conference.participants.filter(x => x.username === adalService.userInfo.userName)[0];

        const payload = new ParticipantStatusMessage(participant.id, participant.username, conference.id, ParticipantStatus.InConsultation);

        participantStatusSubject.next(payload);
        expect(consultationService.clearModals).toHaveBeenCalledTimes(1);
    });
    it('should show observers, panel members, endpoints and participants', () => {
        participantsObserverPanelMember.forEach(x => {
            component.conference.participants.push(x);
        });
        const endpoints = new ConferenceTestData().getListOfEndpoints();
        conference.endpoints = endpoints;

        component.ngOnInit();

        expect(component.nonJugdeParticipants).toBeDefined();
        expect(component.nonJugdeParticipants.length).toBe(2);

        expect(component.observers).toBeDefined();
        expect(component.observers.length).toBe(2);
        expect(component.panelMembers).toBeDefined();
        expect(component.panelMembers.length).toBe(1);

        expect(component.getNumberParticipants).toBe(5);
        expect(component.endpoints).toBeDefined();
        expect(component.endpoints.length).toBe(2);
    });
});
