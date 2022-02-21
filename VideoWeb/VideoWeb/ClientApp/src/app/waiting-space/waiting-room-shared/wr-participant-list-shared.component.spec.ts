import { OnDestroy, OnInit } from '@angular/core';
import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    LoggedParticipantResponse,
    EndpointStatus,
    ParticipantResponse,
    ParticipantStatus,
    VideoEndpointResponse,
    Role,
    RoomSummaryResponse
} from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { judgeTestProfile } from 'src/app/testing/data/test-profiles';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { consultationServiceSpyFactory } from 'src/app/testing/mocks/mock-consultation.service';
import { eventsServiceSpy, participantStatusSubjectMock } from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { WRParticipantStatusListDirective } from './wr-participant-list-shared.component';
import { HearingRole } from '../models/hearing-role-model';
import { TranslateService } from '@ngx-translate/core';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';

class WrParticipantStatusListTest extends WRParticipantStatusListDirective implements OnInit, OnDestroy {
    constructor(
        protected consultationService: ConsultationService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected videoWebService: VideoWebService,
        protected translateService: TranslateService
    ) {
        super(consultationService, eventService, videoWebService, logger, translateService);
    }

    ngOnInit() {
        this.initParticipants();
        this.addSharedEventHubSubcribers();
    }

    ngOnDestroy(): void {
        this.executeTeardown();
    }
}

describe('WaitingRoom ParticipantList Base', () => {
    let component: WrParticipantStatusListTest;
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    let consultationService: jasmine.SpyObj<ConsultationService>;
    const translateService = translateServiceSpy;
    const eventsService = eventsServiceSpy;
    const judgeProfile = judgeTestProfile;
    const logger: Logger = new MockLogger();
    let conference: ConferenceResponse;
    const participantStatusSubject = participantStatusSubjectMock;

    beforeAll(() => {
        consultationService = consultationServiceSpyFactory();
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['updateParticipantDetails', 'getObfuscatedName']);
        videoWebService.getObfuscatedName.and.returnValue('test username');
    });

    beforeEach(() => {
        conference = new ConferenceTestData().getConferenceDetailNow();
        const participantObserverPanelMember = new ConferenceTestData().getListOfParticipantsObserverAndPanelMembers();
        participantObserverPanelMember.forEach(x => conference.participants.push(x));
        const loggedUser = conference.participants.find(x => x.role === Role.Judge);
        const userLogged = new LoggedParticipantResponse({
            participant_id: loggedUser.id,
            display_name: loggedUser.display_name,
            role: loggedUser.role
        });

        component = new WrParticipantStatusListTest(consultationService, eventsService, logger, videoWebService, translateService);
        component.conference = conference;
        component.loggedInUser = userLogged;
        component.ngOnInit();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    describe('DoCheck', () => {
        const testParticipants = [new ParticipantResponse(), new ParticipantResponse()];
        beforeEach(() => {
            const spy = spyOn(component, 'initParticipants');
            component.conference.participants = testParticipants;
            component.ngDoCheck();
            spy.calls.reset();
        });

        it('should not call initParticipants when there are no changes to list', () => {
            component.ngDoCheck();

            expect(component.initParticipants).not.toHaveBeenCalled();
        });

        it('should call initParticipants when there are changes to list', () => {
            component.conference.participants = [new ParticipantResponse()];

            component.ngDoCheck();

            expect(component.initParticipants).toHaveBeenCalledTimes(1);
        });
    });

    it('should group type of participants', () => {
        expect(component.judge).toBeDefined();
        expect(component.nonJudgeParticipants).toBeDefined();
        expect(component.nonJudgeParticipants.length).toBe(2);

        expect(component.observers).toBeDefined();
        expect(component.observers.length).toBe(2);

        expect(component.panelMembers).toBeDefined();
        expect(component.panelMembers.length).toBe(1);

        expect(component.participantCount).toBe(6);

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
            hearing_role: HearingRole.WITNESS
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

    it('should close all open modals when current user is transferred to a consultation room', fakeAsync(() => {
        consultationService.clearModals.calls.reset();
        const loggedInUser = component.conference.participants.find(x => x.id === component.loggedInUser.participant_id);
        const payload = new ParticipantStatusMessage(loggedInUser.id, '', conference.id, ParticipantStatus.InConsultation);
        participantStatusSubject.next(payload);
        flushMicrotasks();

        expect(consultationService.clearModals).toHaveBeenCalledTimes(1);
    }));

    it('should reapply filters when another participant is transferred to a consultation room', () => {
        consultationService.clearModals.calls.reset();
        const indivUser = conference.participants.find(x => x.role === Role.Individual);

        const payload = new ParticipantStatusMessage(indivUser.id, '', conference.id, ParticipantStatus.InConsultation);
        participantStatusSubject.next(payload);

        expect(consultationService.clearModals).toHaveBeenCalledTimes(0);
    });

    it('should be allowed to invite in consultation if the participant is in the participants room', () => {
        const indivUser = conference.participants.find(x => x.role === Role.Individual);
        indivUser.current_room = new RoomSummaryResponse({ label: 'ParticipantCourtRoom' });
        indivUser.linked_participants = [];
        component.loggedInUser.participant_id = indivUser.id;
        component.loggedInUser.role = Role.Individual;
        component.conference = conference;
        expect(component.canInvite).toBe(true);
    });
    it('should not be allowed to invite in consultation if the participant is in the JOH room', () => {
        const indivUser = conference.participants.find(x => x.role === Role.Individual);
        indivUser.current_room = new RoomSummaryResponse({ label: 'JudgeJOHCourtRoom' });
        indivUser.linked_participants = [];
        component.loggedInUser.participant_id = indivUser.id;
        component.loggedInUser.role = Role.Individual;
        component.conference = conference;
        expect(component.canInvite).toBe(false);
    });
    it('should be allowed to invite in consultation if the participant is in a Judge or JOH ', () => {
        const indivUser = conference.participants.find(x => x.role === Role.JudicialOfficeHolder);
        indivUser.linked_participants = [];
        indivUser.current_room = new RoomSummaryResponse({ label: 'JudgeJOHCourtRoom' });
        component.loggedInUser.participant_id = indivUser.id;
        component.loggedInUser.role = Role.JudicialOfficeHolder;
        component.conference = conference;
        expect(component.canInvite).toBe(true);
    });
    it('should be allowed to invite if the logged in user is a Judge or JOH and has linked participants ', () => {
        const indivUser = conference.participants.find(x => x.role === Role.JudicialOfficeHolder);
        indivUser.linked_participants = [{} as any];
        indivUser.current_room = new RoomSummaryResponse({ label: 'JudgeJOHCourtRoom' });
        component.loggedInUser.participant_id = indivUser.id;
        component.loggedInUser.role = Role.JudicialOfficeHolder;
        component.conference = conference;
        expect(component.canInvite).toBe(true);
    });
    it('should be allowed to invite if the logged in user is a Staff Member', () => {
        const staffMember = conference.participants.find(x => x.role === Role.StaffMember);
        component.loggedInUser.participant_id = staffMember.id;
        component.loggedInUser.role = Role.StaffMember;
        component.conference = conference;
        expect(component.canInvite).toBe(true);
    });
    it('should not be allowed to invite if the logged in user is not a Judge or JOH and has linked participants ', () => {
        const indivUser = conference.participants.find(x => x.role === Role.Individual);
        indivUser.linked_participants = [{} as any];
        indivUser.current_room = new RoomSummaryResponse({ label: 'JudgeJOHCourtRoom' });
        component.loggedInUser.participant_id = indivUser.id;
        component.loggedInUser.role = Role.Individual;
        component.conference = conference;
        expect(component.canInvite).toBe(false);
    });

    describe('ParticipantStatusListSupportForInterpreter', () => {
        const testData = new ConferenceTestData();
        let userInfo: { userName: string; authenticated: boolean };

        beforeAll(() => {
            consultationService = consultationServiceSpyFactory();
            userInfo = { userName: judgeProfile.username, authenticated: true };
            videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['updateParticipantDetails', 'getObfuscatedName']);
            videoWebService.getObfuscatedName.and.returnValue('test username');
        });

        beforeEach(() => {
            conference = testData.getConferenceDetailNow();
            const firstLinkedParticipants = testData.getListOfLinkedParticipants();
            firstLinkedParticipants.forEach(x => conference.participants.push(x));
            const secondLinkedParticipants = testData.getListOfExtraLinkedParticipants();
            secondLinkedParticipants.forEach(x => conference.participants.push(x));
            const participantObserverPanelMember = testData.getListOfParticipantsObserverAndPanelMembers();
            participantObserverPanelMember.forEach(x => conference.participants.push(x));
            const loggedUser = conference.participants.find(x => x.role === Role.Judge);
            const userLogged = new LoggedParticipantResponse({
                participant_id: loggedUser.id,
                display_name: loggedUser.display_name,
                role: loggedUser.role
            });

            component = new WrParticipantStatusListTest(consultationService, eventsService, logger, videoWebService, translateService);
            component.conference = conference;
            component.loggedInUser = userLogged;
            component.ngOnInit();
        });

        afterEach(() => {
            jasmine.getEnv().allowRespy(true);
            component.ngOnDestroy();
        });

        it('should create', () => {
            expect(component).toBeTruthy();
            expect(component.judge).toBeDefined();
            expect(component.nonJudgeParticipants).toBeDefined();
            expect(component.nonJudgeParticipants.length).toBe(6);

            expect(component.observers).toBeDefined();
            expect(component.observers.length).toBe(2);

            expect(component.panelMembers).toBeDefined();
            expect(component.panelMembers.length).toBe(1);

            expect(component.staffMembers).toBeDefined();
            expect(component.staffMembers.length).toBe(1);

            expect(component.wingers).toBeDefined();
            expect(component.wingers.length).toBe(0);

            expect(component.endpoints).toBeDefined();
            expect(component.endpoints.length).toBe(2);

            expect(component.participantCount).toBe(10);
        });

        it('interpreter and interpretee should have hasInterpreterLink set to true', () => {
            const interpreter = component.nonJudgeParticipants.find(
                x => x.hearing_role === HearingRole.INTERPRETER && x.display_name === 'Interpreter'
            );
            const interpretee = component.nonJudgeParticipants.find(
                x => x.hearing_role === HearingRole.LITIGANT_IN_PERSON && x.display_name === 'Interpretee'
            );
            expect(component.hasInterpreterLink(interpreter)).toBeTrue();
            expect(component.hasInterpreterLink(interpretee)).toBeTrue();
        });

        it('participant list should always have interpretee before interpreter', () => {
            const interpreteeIndex = component.nonJudgeParticipants.findIndex(
                x => x.hearing_role === HearingRole.LITIGANT_IN_PERSON && x.display_name === 'Interpretee'
            );
            const interpreterIndex = component.nonJudgeParticipants.findIndex(
                x => x.hearing_role === HearingRole.INTERPRETER && x.display_name === 'Interpreter'
            );
            expect(interpreterIndex).toEqual(interpreteeIndex + 1);
        });

        it('participant list should always have interpretee before each interpreter when multiple interpreters exist', () => {
            const interpretee1Index = component.nonJudgeParticipants.findIndex(
                x => x.hearing_role === HearingRole.LITIGANT_IN_PERSON && x.display_name === 'Interpretee'
            );

            const interpreter1Index = component.nonJudgeParticipants.findIndex(
                x => x.hearing_role === HearingRole.INTERPRETER && x.display_name === 'Interpreter'
            );

            const interpretee2Index = component.nonJudgeParticipants.findIndex(
                x => x.hearing_role === HearingRole.LITIGANT_IN_PERSON && x.display_name === 'Interpretee 2'
            );

            const interpreter2Index = component.nonJudgeParticipants.findIndex(
                x => x.hearing_role === HearingRole.INTERPRETER && x.display_name === 'Interpreter 2'
            );

            expect(interpreter1Index).toEqual(interpretee1Index + 1);
            expect(interpreter2Index).toEqual(interpretee2Index + 1);
        });

        it('getInterpreteeName should return the name of the interpretee given the interpreterId', () => {
            const interpreter = component.nonJudgeParticipants.find(
                x => x.hearing_role === HearingRole.INTERPRETER && x.display_name === 'Interpreter'
            );
            const interpretee = component.nonJudgeParticipants.find(
                x => x.hearing_role === HearingRole.LITIGANT_IN_PERSON && x.display_name === 'Interpretee'
            );
            const interpreteeName = component.getInterpreteeName(interpreter.id);

            expect(interpreteeName).toEqual(interpretee.name);
        });

        it('getHearingRole should return contain Interpreter for when displaying an Interpreter', () => {
            const interpreter = component.nonJudgeParticipants.find(
                x => x.hearing_role === HearingRole.INTERPRETER && x.display_name === 'Interpreter'
            );
            const interpretee = component.nonJudgeParticipants.find(
                x => x.hearing_role === HearingRole.LITIGANT_IN_PERSON && x.display_name === 'Interpretee'
            );
            const hearingRoleText = component.getHearingRole(interpreter);

            expect(hearingRoleText).toEqual(
                `hearing-role.interpreter wr-participant-list-shared.for <br><strong>${interpretee.name}</strong>`
            );
        });

        it('getHearingRole should return contain Representative for when displaying a participant with Representee set and a case type set', () => {
            const representative = component.nonJudgeParticipants.find(x => x.hearing_role === HearingRole.REPRESENTATIVE);
            const hearingRoleText = component.getHearingRole(representative);

            expect(hearingRoleText).toEqual(
                `wr-participant-list-shared.representative wr-participant-list-shared.for <br><strong>${representative.representee}</strong>`
            );
        });

        it('getHearingRole should return contain the hearing role when displaying a participant', () => {
            const litigant = component.nonJudgeParticipants.find(x => x.hearing_role === HearingRole.LITIGANT_IN_PERSON);
            const hearingRoleText = component.getHearingRole(litigant);

            expect(hearingRoleText).toEqual('hearing-role.litigant-in-person');
        });

        it('getHearingRole should return contain the hearing role when displaying a participant', () => {
            const participant = new ParticipantResponse();
            participant.hearing_role = 'Quick link participant';
            const hearingRoleText = component.getHearingRole(participant);

            expect(hearingRoleText).toEqual('hearing-role.quick-link-participant');
        });

        it('getHearingRole should return contain the hearing role when displaying a participant', () => {
            const participant = new ParticipantResponse();
            participant.hearing_role = 'Quick link observer';
            const hearingRoleText = component.getHearingRole(participant);

            expect(hearingRoleText).toEqual('hearing-role.quick-link-observer');
        });
    });

    describe('initParticipants', () => {
        it('should filter and sort non-judge participants correctly', () => {
            conference.participants = new ConferenceTestData().getFullListOfParticipants();
            component.initParticipants();
            const nonJudgeParticipants = component.nonJudgeParticipants;

            const applicant1Index = nonJudgeParticipants.findIndex(x => x.name === 'Mr A Smith');
            const applicant2Index = nonJudgeParticipants.findIndex(x => x.name === 'Mr B Smith');
            const applicant3Index = nonJudgeParticipants.findIndex(x => x.name === 'Mr G Smith');
            const respondent1Index = nonJudgeParticipants.findIndex(x => x.name === 'Mr E Smith');
            const respondent2Index = nonJudgeParticipants.findIndex(x => x.name === 'Mr F Smith');
            const quickLinkParticipant1Index = nonJudgeParticipants.findIndex(x => x.name === 'Mr C Smith');
            const quickLinkParticipant2Index = nonJudgeParticipants.findIndex(x => x.name === 'Mr D Smith');

            expect(applicant1Index).toEqual(0);
            expect(applicant2Index).toEqual(1);
            expect(applicant3Index).toEqual(2);
            expect(respondent1Index).toEqual(3);
            expect(respondent2Index).toEqual(4);
            expect(quickLinkParticipant1Index).toEqual(5);
            expect(quickLinkParticipant2Index).toEqual(6);
        });
    });
});
