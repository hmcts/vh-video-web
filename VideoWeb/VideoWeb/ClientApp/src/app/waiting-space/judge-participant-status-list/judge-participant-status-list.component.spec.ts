import { AdalService } from 'adal-angular4';
import { ConferenceResponse, ParticipantStatus, EndpointStatus } from 'src/app/services/clients/api-client';
import { individualTestProfile, judgeTestProfile } from 'src/app/testing/data/test-profiles';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { VideoWebService } from '../../services/api/video-web.service';
import { Logger } from '../../services/logging/logger-base';
import { JudgeParticipantStatusListComponent } from './judge-participant-status-list.component';

describe('JudgeParticipantStatusListComponent', () => {
    let component: JudgeParticipantStatusListComponent;
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    let adalService: jasmine.SpyObj<AdalService>;
    const judgeProfile = judgeTestProfile;
    const individualProfile = individualTestProfile;
    const logger: Logger = new MockLogger();
    let conference: ConferenceResponse;

    beforeAll(() => {
        adalService = jasmine.createSpyObj<AdalService>('AdalService', ['init', 'handleWindowCallback', 'userInfo', 'logOut'], {
            userInfo: <adal.User>{ userName: judgeProfile.username, authenticated: true }
        });
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['updateParticipantDetails']);
    });

    beforeEach(() => {
        conference = new ConferenceTestData().getConferenceDetailNow();
        const participantObserverPanelMember = new ConferenceTestData().getListOfParticipantsObserverAndPanelMembers();
        participantObserverPanelMember.forEach(x => conference.participants.push(x));
        const endpoints = new ConferenceTestData().getListOfEndpoints();
        conference.endpoints = endpoints;
        component = new JudgeParticipantStatusListComponent(adalService, videoWebService, logger);
        component.conference = conference;
        component.ngOnInit();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        expect(component.judge).toBeDefined();
        expect(component.nonJudgeParticipants).toBeDefined();
        expect(component.nonJudgeParticipants.length).toBe(2);

        expect(component.observers).toBeDefined();
        expect(component.observers.length).toBe(2);

        expect(component.panelMembers).toBeDefined();
        expect(component.panelMembers.length).toBe(1);

        expect(component.getParticipantsCount()).toBe(5);

        expect(component.endpoints).toBeDefined();
        expect(component.endpoints.length).toBe(2);
    });

    it('should show input template for change judge display name', () => {
        component.changeJudgeNameShow();
        expect(component.showChangeJudgeDisplayName).toBe(true);
        expect(component.newJudgeDisplayName).toBe(component.judge.display_name);
    });

    it('should hide input template for change judge display name', () => {
        component.cancelJudgeDisplayName();
        expect(component.showChangeJudgeDisplayName).toBe(false);
    });

    it('should update new judge display name with user input', () => {
        const newName = 'new name';
        component.onEnterJudgeDisplayName(newName);
        expect(component.newJudgeDisplayName).toBe(newName);
    });

    it('should save new judge display name in database', async () => {
        const newName = 'new name';
        component.onEnterJudgeDisplayName(newName);
        await component.saveJudgeDisplayName();
        expect(component.judge.display_name).toBe(newName);
        expect(component.showChangeJudgeDisplayName).toBe(false);
        expect(videoWebService.updateParticipantDetails).toHaveBeenCalledTimes(1);
    });

    it('should log error when unable to save new judge name', async () => {
        const error = { error: 'test failure' };
        const newName = 'new name';
        component.onEnterJudgeDisplayName(newName);
        videoWebService.updateParticipantDetails.and.rejectWith(error);
        spyOn(logger, 'error');

        await component.saveJudgeDisplayName();

        expect(logger.error).toHaveBeenCalled();
    });
    it('should get the participant count excluding judge', () => {
        const participantCount = component.getParticipantsCount();
        expect(participantCount).toBe(component.nonJudgeParticipants.length + component.observers.length + component.panelMembers.length);
    });

    const participantStatusTestCases = [
        { status: ParticipantStatus.Available, expected: 'Connected' },
        { status: ParticipantStatus.InConsultation, expected: 'In consultation' },
        { status: ParticipantStatus.InHearing, expected: 'Connected' },
        { status: ParticipantStatus.Disconnected, expected: 'Disconnected' },
        { status: ParticipantStatus.Joining, expected: 'Joining' },
        { status: ParticipantStatus.NotSignedIn, expected: 'Not signed in' },
        { status: ParticipantStatus.None, expected: 'Not signed in' }
    ];

    participantStatusTestCases.forEach(test => {
        it(`should return ${test.expected} when participant status is ${test.status}`, () => {
            const pat = component.conference.participants[0];
            pat.status = test.status;
            expect(component.getParticipantStatus(pat)).toBe(test.expected);
        });
    });

    const participantStatusCssTestCases = [
        { status: ParticipantStatus.Available, expected: 'available' },
        { status: ParticipantStatus.Disconnected, expected: 'disconnected' },
        { status: ParticipantStatus.InConsultation, expected: 'in_consultation' },
        { status: ParticipantStatus.InHearing, expected: 'in_hearing' },
        { status: ParticipantStatus.Joining, expected: 'joining' },
        { status: ParticipantStatus.NotSignedIn, expected: 'not_signed_in' },
        { status: ParticipantStatus.None, expected: 'not_signed_in' }
    ];

    participantStatusCssTestCases.forEach(test => {
        it(`should return class ${test.expected} when participant status is ${test.status}`, () => {
            const pat = component.conference.participants[0];
            pat.status = test.status;
            expect(component.getParticipantStatusCss(pat)).toBe(test.expected);
        });
    });

    const endpointsStatusTestCases = [
        { status: EndpointStatus.NotYetJoined, expected: 'Not yet joined' },
        { status: EndpointStatus.Disconnected, expected: 'Disconnected' },
        { status: EndpointStatus.Connected, expected: 'Connected' }
    ];

    endpointsStatusTestCases.forEach(test => {
        it(`should return ${test.expected} when endpoint status is ${test.status}`, () => {
            const endpoint = component.conference.endpoints[0];
            endpoint.status = test.status;
            expect(component.getEndpointStatus(endpoint)).toBe(test.expected);
        });
    });

    const endpointsStatusCssTestCases = [
        { status: EndpointStatus.NotYetJoined, expected: 'not_yet_joined' },
        { status: EndpointStatus.Disconnected, expected: 'disconnected' },
        { status: EndpointStatus.Connected, expected: 'connected' }
    ];

    endpointsStatusCssTestCases.forEach(test => {
        it(`should return ${test.expected} when endpoint status is ${test.status}`, () => {
            const endpoint = component.conference.endpoints[0];
            endpoint.status = test.status;
            expect(component.getEndpointStatusCss(endpoint)).toBe(test.expected);
        });
    });

    it('should return true when user is judge', () => {
        adalService = jasmine.createSpyObj<AdalService>('AdalService', ['init', 'handleWindowCallback', 'userInfo', 'logOut'], {
            userInfo: <adal.User>{ userName: judgeProfile.username, authenticated: true }
        });
        expect(component.isUserJudge()).toBeTruthy();
    });

    it('should return false when user is not judge', () => {
        adalService = jasmine.createSpyObj<AdalService>('AdalService', ['init', 'handleWindowCallback', 'userInfo', 'logOut'], {
            userInfo: <adal.User>{ userName: individualProfile.username, authenticated: true }
        });
        component = new JudgeParticipantStatusListComponent(adalService, videoWebService, logger);
        component.conference = conference;
        expect(component.isUserJudge()).toBeFalsy();
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
