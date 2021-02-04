import { OnDestroy, OnInit } from '@angular/core';
import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { AdalService } from 'adal-angular4';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    EndpointStatus,
    ParticipantResponse,
    ParticipantStatus,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConsultationRequestResponseMessage } from 'src/app/services/models/consultation-request-response-message';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { individualTestProfile, judgeTestProfile } from 'src/app/testing/data/test-profiles';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { consultationServiceSpyFactory } from 'src/app/testing/mocks/mock-consultation-service';
import {
    consultationRequestResponseMessageSubjectMock,
    eventsServiceSpy,
    participantStatusSubjectMock
} from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { WRParticipantStatusListDirective } from './wr-participant-list-shared.component';

class WrParticipantStatusListTest extends WRParticipantStatusListDirective implements OnInit, OnDestroy {
    constructor(
        protected adalService: AdalService,
        protected consultationService: ConsultationService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected videoWebService: VideoWebService
    ) {
        super(adalService, consultationService, eventService, videoWebService, logger);
    }

    ngOnInit() {
        this.initParticipants();
        this.setupSubscribers();
    }

    ngOnDestroy(): void {
        this.executeTeardown();
    }

    setupSubscribers(): void {
        this.addSharedEventHubSubcribers();
    }
    canCallParticipant(participant: ParticipantResponse): boolean {
        return false;
    }
    canCallEndpoint(endpoint: VideoEndpointResponse): boolean {
        return false;
    }
}

describe('WaitingRoom ParticipantList Base', () => {
    let component: WrParticipantStatusListTest;
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    let adalService: jasmine.SpyObj<AdalService>;
    let consultationService: jasmine.SpyObj<ConsultationService>;
    const eventsService = eventsServiceSpy;
    const judgeProfile = judgeTestProfile;
    const indProfile = individualTestProfile;
    const logger: Logger = new MockLogger();
    let conference: ConferenceResponse;
    const consultationRequestResponseMessageSubject = consultationRequestResponseMessageSubjectMock;
    const participantStatusSubject = participantStatusSubjectMock;

    beforeAll(() => {
        consultationService = consultationServiceSpyFactory();

        adalService = jasmine.createSpyObj<AdalService>('AdalService', ['init', 'handleWindowCallback', 'userInfo', 'logOut'], {
            userInfo: <adal.User>{ userName: judgeProfile.username, authenticated: true }
        });
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['updateParticipantDetails', 'getObfuscatedName']);
        videoWebService.getObfuscatedName.and.returnValue('test username');
    });

    beforeEach(() => {
        conference = new ConferenceTestData().getConferenceDetailNow();
        const participantObserverPanelMember = new ConferenceTestData().getListOfParticipantsObserverAndPanelMembers();
        participantObserverPanelMember.forEach(x => conference.participants.push(x));
        component = new WrParticipantStatusListTest(adalService, consultationService, eventsService, logger, videoWebService);
        component.conference = conference;
        component.ngOnInit();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should group type of participants', () => {
        expect(component.judge).toBeDefined();
        expect(component.nonJudgeParticipants).toBeDefined();
        expect(component.nonJudgeParticipants.length).toBe(2);

        expect(component.observers).toBeDefined();
        expect(component.observers.length).toBe(2);

        expect(component.panelMembers).toBeDefined();
        expect(component.panelMembers.length).toBe(1);

        expect(component.participantCount).toBe(5);

        expect(component.endpoints).toBeDefined();
        expect(component.endpoints.length).toBe(2);
    });

    it('should return true when participant has no case type group', () => {
        const pat = new ParticipantResponse({
            id: '9F681318-4955-49AF-A887-DED64554429T',
            name: 'Judge Fudge',
            case_type_group: 'None'
        });
        expect(component.isCaseTypeNone(pat)).toBeTruthy();
    });

    it('should return false when participant has a case type group', () => {
        const pat = new ParticipantResponse({
            id: '9F681318-4955-49AF-A887-DED64554429T',
            name: 'Judge Fudge',
            case_type_group: 'Judge'
        });
        expect(component.isCaseTypeNone(pat)).toBeFalsy();
    });

    it('should return true when participant hearing role is Witness', () => {
        const pat = new ParticipantResponse({
            id: '9F681318-4955-49AF-A887-DED64554429Q',
            name: 'John Witness',
            case_type_group: 'Applicant',
            hearing_role: 'Witness'
        });
        expect(component.isWitness(pat)).toBeTruthy();
    });

    const participantAvailableTestCases = [
        { status: ParticipantStatus.Available, expected: true },
        { status: ParticipantStatus.Disconnected, expected: false },
        { status: ParticipantStatus.InConsultation, expected: false },
        { status: ParticipantStatus.InHearing, expected: false },
        { status: ParticipantStatus.Joining, expected: false },
        { status: ParticipantStatus.NotSignedIn, expected: false },
        { status: ParticipantStatus.None, expected: false }
    ];

    participantAvailableTestCases.forEach(test => {
        it(`should return ${test.expected} for 'isParticipantAvailable' when participant status is ${test.status}`, () => {
            const pat = new ParticipantResponse({
                id: '9F681318-4955-49AF-A887-DED64554429T',
                status: test.status
            });

            expect(component.isParticipantAvailable(pat)).toBe(test.expected);
        });
    });

    const endpointAvailableTestCases = [
        { status: EndpointStatus.NotYetJoined, expected: false },
        { status: EndpointStatus.Connected, expected: true },
        { status: EndpointStatus.Disconnected, expected: false },
        { status: EndpointStatus.InConsultation, expected: false }
    ];

    endpointAvailableTestCases.forEach(test => {
        it(`should return ${test.expected} for 'isEndpointAvailable' when video endpoint status is ${test.status}`, () => {
            const pat = new VideoEndpointResponse({
                id: '9F681318-4955-49AF-A887-DED64554429T',
                status: test.status
            });

            expect(component.isEndpointAvailable(pat)).toBe(test.expected);
        });
    });

    it('should clear subsciptions on teardown', () => {
        component.executeTeardown();
        expect(component.eventHubSubscriptions$.closed).toBe(true);
    });

    it('should logged in user as requester', () => {
        const result = component.getConsultationRequester();
        expect(result.username).toBe(judgeProfile.username);
    });

    it('should not display vho consultation request when participant is unavailable', fakeAsync(() => {
        const index = component.conference.participants.findIndex(x => x.username === judgeProfile.username);
        component.conference.participants[index].status = ParticipantStatus.InHearing;
        const payload = new ConsultationRequestResponseMessage(conference.id, 'AdminRoom', judgeProfile.username, null);

        spyOn(logger, 'debug');
        consultationRequestResponseMessageSubject.next(payload);
        flushMicrotasks();

        expect(logger.debug).toHaveBeenCalled();
    }));

    it('should close all open modals when current user is transferred to a consultation room', fakeAsync(() => {
        consultationService.clearModals.calls.reset();
        const loggedInUser = component.conference.participants.find(x => x.username === judgeProfile.username);
        const payload = new ParticipantStatusMessage(
            loggedInUser.id,
            loggedInUser.username,
            conference.id,
            ParticipantStatus.InConsultation
        );
        participantStatusSubject.next(payload);
        flushMicrotasks();

        expect(consultationService.clearModals).toHaveBeenCalledTimes(1);
    }));

    it('should reapply filters when another participant is transferred to a consultation room', () => {
        consultationService.clearModals.calls.reset();
        const loggedInUser = component.conference.participants.find(x => x.username === judgeProfile.username);
        const payload = new ParticipantStatusMessage(loggedInUser.id, indProfile.username, conference.id, ParticipantStatus.InConsultation);
        participantStatusSubject.next(payload);

        expect(consultationService.clearModals).toHaveBeenCalledTimes(0);
    });

});
