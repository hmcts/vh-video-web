import { fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import {
    ConferenceResponse,
    LoggedParticipantResponse,
    EndpointStatus,
    ParticipantStatus,
    Role
} from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { consultationServiceSpyFactory } from 'src/app/testing/mocks/mock-consultation.service';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { VideoWebService } from '../../services/api/video-web.service';
import { Logger } from '../../services/logging/logger-base';
import { JudgeParticipantStatusListComponent } from './judge-participant-status-list.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { HearingRole } from '../models/hearing-role-model';

describe('JudgeParticipantStatusListComponent', () => {
    const testData = new ConferenceTestData();

    let component: JudgeParticipantStatusListComponent;
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    let consultationService: jasmine.SpyObj<ConsultationService>;
    const eventsService = eventsServiceSpy;
    const logger: Logger = new MockLogger();
    let conference: ConferenceResponse;
    let activatedRoute: ActivatedRoute;
    const translateService = translateServiceSpy;
    let editedStaffMember;

    beforeAll(() => {
        consultationService = consultationServiceSpyFactory();
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['updateParticipantDetails', 'getObfuscatedName']);
        const logged = new LoggedParticipantResponse({
            participant_id: '1111-1111',
            display_name: 'Some name',
            role: Role.Individual
        });
        videoWebService.getObfuscatedName.and.returnValue('test username');
        activatedRoute = <any>{
            snapshot: { data: { loggedUser: logged } }
        };
    });

    beforeEach(() => {
        conference = testData.getConferenceDetailNow();
        const participantObserverPanelMember = testData.getListOfParticipantsObserverAndPanelMembers();
        participantObserverPanelMember.forEach(x => conference.participants.push(x));
        const participantWinger = new ConferenceTestData().getListOfParticipantsWingers();
        participantWinger.forEach(x => conference.participants.push(x));
        component = new JudgeParticipantStatusListComponent(
            consultationService,
            eventsService,
            logger,
            videoWebService,
            activatedRoute,
            translateService
        );
        component.conference = conference;
        component.ngOnInit();
        editedStaffMember = conference.participants.find(p => p.hearing_role === HearingRole.STAFF_MEMBER);
    });

    afterEach(() => {
        jasmine.getEnv().allowRespy(true);
        component.ngOnDestroy();
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

        expect(component.staffMembers).toBeDefined();
        expect(component.staffMembers.length).toBe(1);

        expect(component.wingers).toBeDefined();
        expect(component.wingers.length).toBe(1);

        expect(component.endpoints).toBeDefined();
        expect(component.endpoints.length).toBe(2);

        expect(component.participantCount).toBe(7);
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

    it('should show input template for change staff member display name', () => {
        component.changeStaffMemberNameShow(editedStaffMember.id);
        expect(component.showChangeStaffMemberDisplayName).toBe(true);

        expect(component.newStaffMemberDisplayName).toBe(component.staffMembers.find(p => p.id === editedStaffMember.id).display_name);
    });

    it('should hide input template for change judge display name', () => {
        component.cancelStaffMemberDisplayName();
        expect(component.showChangeStaffMemberDisplayName).toBe(false);
    });

    it('should update new judge display name with user input', () => {
        const newName = 'new name';
        component.onEnterJudgeDisplayName(newName);
        expect(component.newJudgeDisplayName).toBe(newName);
    });

    it('should updateParticipantDetails when save judge new display name', async () => {
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

    it('should update new staff member display name with user input', () => {
        const newName = 'new name';
        component.onEnterStaffMemberDisplayName(newName);
        expect(component.newStaffMemberDisplayName).toBe(newName);
    });

    it('should updateParticipantDetails when save staff member new display name', async () => {
        videoWebService.updateParticipantDetails.calls.reset();
        const newName = 'new name';
        component.onEnterStaffMemberDisplayName(newName);
        await component.saveStaffMemberDisplayName(editedStaffMember.id);
        expect(component.staffMembers.find(p => p.id === editedStaffMember.id).display_name).toBe(newName);
        expect(component.showChangeStaffMemberDisplayName).toBe(false);
        expect(videoWebService.updateParticipantDetails).toHaveBeenCalledTimes(1);
    });

    it('should log error when unable to save new staff member name', async () => {
        const error = { error: 'test failure' };
        const newName = 'new name';
        component.onEnterStaffMemberDisplayName(newName);
        videoWebService.updateParticipantDetails.and.rejectWith(error);
        spyOn(logger, 'error');

        await component.saveStaffMemberDisplayName(editedStaffMember.id);

        expect(logger.error).toHaveBeenCalled();
    });

    it('should get the participant count excluding judge', () => {
        const participantCount = component.participantCount;
        const expected = component.conference.participants.filter(x => x.role !== Role.Judge).length;
        expect(participantCount).toBe(expected);
    });

    const participantStatusTestCases = [
        { status: ParticipantStatus.Available, expected: 'judge-participant-status-list.connected' },
        { status: ParticipantStatus.InConsultation, expected: 'participant-status.inconsultation' },
        { status: ParticipantStatus.InHearing, expected: 'judge-participant-status-list.connected' },
        { status: ParticipantStatus.Disconnected, expected: 'participant-status.disconnected' },
        { status: ParticipantStatus.Joining, expected: 'participant-status.joining' },
        { status: ParticipantStatus.NotSignedIn, expected: 'participant-status.notsignedin' },
        { status: ParticipantStatus.None, expected: 'judge-participant-status-list.not-signed-in' }
    ];

    participantStatusTestCases.forEach(test => {
        it(`should return ${test.expected} when participant status is ${test.status}`, () => {
            const pat = component.conference.participants[0];
            pat.status = test.status;
            translateService.instant.calls.reset();
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
            translateService.instant.calls.reset();
            expect(component.getParticipantStatusCss(pat)).toBe(test.expected);
        });
    });

    const endpointsStatusTestCases = [
        { status: EndpointStatus.NotYetJoined, expected: 'endpoint-status.notyetjoined' },
        { status: EndpointStatus.Disconnected, expected: 'endpoint-status.disconnected' },
        { status: EndpointStatus.Connected, expected: 'endpoint-status.connected' }
    ];

    endpointsStatusTestCases.forEach(test => {
        it(`should return ${test.expected} when endpoint status is ${test.status}`, () => {
            const endpoint = component.conference.endpoints[0];
            endpoint.status = test.status;
            translateService.instant.calls.reset();
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
    it('should return false when user is not judge', () => {
        expect(component.isUserJudge).toBeFalsy();
    });
    it('should return true when user is judge', fakeAsync(async () => {
        const logged = new LoggedParticipantResponse({
            participant_id: conference.participants.find(x => x.role === Role.Judge).id,
            display_name: 'Judge Name',
            role: Role.Judge
        });
        activatedRoute = activatedRoute = <any>{
            snapshot: { data: { loggedUser: logged } }
        };
        component = new JudgeParticipantStatusListComponent(
            consultationService,
            eventsService,
            logger,
            videoWebService,
            activatedRoute,
            translateService
        );
        component.conference = conference;
        component.ngOnInit();
        expect(component.isUserJudge).toBeTruthy();
    }));
});
