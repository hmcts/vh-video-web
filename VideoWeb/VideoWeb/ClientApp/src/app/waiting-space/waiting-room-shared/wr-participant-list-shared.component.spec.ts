import { OnDestroy, OnInit } from '@angular/core';
import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { LoggedParticipantResponse, EndpointStatus, ParticipantStatus, Role, LinkType } from 'src/app/services/clients/api-client';
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
import { FocusService } from 'src/app/services/focus.service';
import { VHConference, VHEndpoint, VHParticipant } from '../store/models/vh-conference';
import {
    mapConferenceToVHConference,
    mapEndpointToVHEndpoint,
    mapParticipantToVHParticipant
} from '../store/models/api-contract-to-state-model-mappers';

class WrParticipantStatusListTest extends WRParticipantStatusListDirective implements OnInit, OnDestroy {
    constructor(
        protected consultationService: ConsultationService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected videoWebService: VideoWebService,
        protected translateService: TranslateService,
        protected focusService: FocusService
    ) {
        super(consultationService, eventService, videoWebService, logger, translateService, focusService);
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
    let conference: VHConference;
    const participantStatusSubject = participantStatusSubjectMock;
    let focusServiceSpy: jasmine.SpyObj<FocusService>;

    beforeAll(() => {
        consultationService = consultationServiceSpyFactory();
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['updateParticipantDisplayName', 'getObfuscatedName']);
        videoWebService.getObfuscatedName.and.returnValue('test username');
    });

    beforeEach(() => {
        focusServiceSpy = jasmine.createSpyObj<FocusService>('FocusService', ['restoreFocus', 'storeFocus']);
        conference = mapConferenceToVHConference(new ConferenceTestData().getConferenceDetailNow());
        const participantObserverPanelMember = new ConferenceTestData()
            .getListOfParticipantsObserverAndPanelMembers()
            .map(x => mapParticipantToVHParticipant(x));
        participantObserverPanelMember.forEach(x => conference.participants.push(x));
        const loggedUser = conference.participants.find(x => x.role === Role.Judge);
        const userLogged = new LoggedParticipantResponse({
            participant_id: loggedUser.id,
            display_name: loggedUser.displayName,
            role: loggedUser.role
        });

        component = new WrParticipantStatusListTest(
            consultationService,
            eventsService,
            logger,
            videoWebService,
            translateService,
            focusServiceSpy
        );
        component.conference = conference;
        component.loggedInUser = userLogged;
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

        expect(component.participantCount).toBe(6);

        expect(component.endpoints).toBeDefined();
        expect(component.endpoints.length).toBe(2);
    });

    it('should display participant list when non-judge participants are present', () => {
        component.ngOnChanges();
        expect(component.displayParticipantList).toBeTrue();
    });

    it('should return true when participant hearing role is Witness', () => {
        const pat = jasmine.createSpyObj<VHParticipant>('VHParticipant', ['hearingRole']);
        pat.hearingRole = HearingRole.WITNESS;
        expect(component.isWitness(pat)).toBeTruthy();
    });

    it('should return true when participant hearing role is Expert', () => {
        const pat = jasmine.createSpyObj<VHParticipant>('VHParticipant', ['hearingRole']);
        pat.hearingRole = HearingRole.EXPERT;
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
            const pat = jasmine.createSpyObj<VHParticipant>('VHParticipant', ['id', 'name', 'hearingRole']);
            pat.status = test.status;

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
            const pat = jasmine.createSpyObj<VHEndpoint>('VHEndpoint', ['id', 'status']);
            pat.id = '9F681318-4955-49AF-A887-DED64554429T';
            pat.status = test.status;

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
        indivUser.room = { label: 'ParticipantCourtRoom', locked: false };
        indivUser.linkedParticipants = [];
        component.loggedInUser.participant_id = indivUser.id;
        component.loggedInUser.role = Role.Individual;
        component.conference = conference;
        expect(component.canInvite).toBe(true);
    });
    it('should not be allowed to invite in consultation if the participant is in the JOH room', () => {
        const indivUser = conference.participants.find(x => x.role === Role.Individual);
        indivUser.room = { label: 'JudgeJOHCourtRoom', locked: false };
        indivUser.linkedParticipants = [];
        component.loggedInUser.participant_id = indivUser.id;
        component.loggedInUser.role = Role.Individual;
        component.conference = conference;
        expect(component.canInvite).toBe(false);
    });
    it('should be allowed to invite in consultation if the participant is in a Judge or JOH ', () => {
        const indivUser = conference.participants.find(x => x.role === Role.JudicialOfficeHolder);
        indivUser.linkedParticipants = [];
        indivUser.room = { label: 'JudgeJOHCourtRoom', locked: false };
        component.loggedInUser.participant_id = indivUser.id;
        component.loggedInUser.role = Role.JudicialOfficeHolder;
        component.conference = conference;
        expect(component.canInvite).toBe(true);
    });
    it('should be allowed to invite if the logged in user is a Judge or JOH and has linked participants ', () => {
        const indivUser = conference.participants.find(x => x.role === Role.JudicialOfficeHolder);
        indivUser.linkedParticipants = [{} as any];
        indivUser.room = { label: 'JudgeJOHCourtRoom', locked: false };
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
        indivUser.linkedParticipants = [{} as any];
        indivUser.room = { label: 'JudgeJOHCourtRoom', locked: false };
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
            videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
                'updateParticipantDisplayName',
                'getObfuscatedName'
            ]);
            videoWebService.getObfuscatedName.and.returnValue('test username');
        });

        beforeEach(() => {
            conference = mapConferenceToVHConference(testData.getConferenceDetailNow());
            const firstLinkedParticipants = testData.getListOfLinkedParticipants().map(x => mapParticipantToVHParticipant(x));
            firstLinkedParticipants.forEach(x => conference.participants.push(x));
            const secondLinkedParticipants = testData.getListOfExtraLinkedParticipants().map(x => mapParticipantToVHParticipant(x));
            secondLinkedParticipants.forEach(x => conference.participants.push(x));
            const participantObserverPanelMember = testData
                .getListOfParticipantsObserverAndPanelMembers()
                .map(x => mapParticipantToVHParticipant(x));
            participantObserverPanelMember.forEach(x => conference.participants.push(x));
            const loggedUser = conference.participants.find(x => x.role === Role.Judge);
            const userLogged = new LoggedParticipantResponse({
                participant_id: loggedUser.id,
                display_name: loggedUser.displayName,
                role: loggedUser.role
            });

            component = new WrParticipantStatusListTest(
                consultationService,
                eventsService,
                logger,
                videoWebService,
                translateService,
                focusServiceSpy
            );
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
                x => x.hearingRole === HearingRole.INTERPRETER && x.displayName === 'Interpreter'
            );
            const interpretee = component.nonJudgeParticipants.find(
                x => x.hearingRole === HearingRole.LITIGANT_IN_PERSON && x.displayName === 'Interpretee'
            );
            expect(component.hasInterpreterLink(interpreter)).toBeTrue();
            expect(component.hasInterpreterLink(interpretee)).toBeTrue();
        });

        it('participant list should always have interpretee before interpreter', () => {
            const interpreteeIndex = component.nonJudgeParticipants.findIndex(
                x => x.hearingRole === HearingRole.LITIGANT_IN_PERSON && x.displayName === 'Interpretee'
            );
            const interpreterIndex = component.nonJudgeParticipants.findIndex(
                x => x.hearingRole === HearingRole.INTERPRETER && x.displayName === 'Interpreter'
            );
            expect(interpreterIndex).toEqual(interpreteeIndex + 1);
        });

        it('participant list should not duplicate interpreter', () => {
            // setup
            component.conference.participants = [
                {
                    id: '670d3f03-c406-485b-8d71-ea5e785bbf86',
                    name: 'Mrs Manual Individual 216',
                    status: ParticipantStatus.NotSignedIn,
                    displayName: 'A',
                    role: Role.Individual,
                    tiledDisplayName: 'CIVILIAN;NO_HEARTBEAT;A;670d3f03-c406-485b-8d71-ea5e785bbf86',
                    hearingRole: HearingRole.LITIGANT_IN_PERSON,
                    firstName: 'Manual',
                    lastName: 'Individual 216',
                    username: 'manual.individual_216@hearings.reform.hmcts.net',
                    linkedParticipants: [
                        {
                            linkedId: '02778ddf-b472-4e5d-807e-da8248d1b91f',
                            linkedType: LinkType.Interpreter
                        }
                    ],
                    representee: ''
                },
                {
                    id: '02778ddf-b472-4e5d-807e-da8248d1b91f',
                    name: 'Mrs Manual Interpreter 14',
                    status: ParticipantStatus.NotSignedIn,
                    displayName: 'B',
                    role: Role.Individual,
                    tiledDisplayName: 'CIVILIAN;NO_HEARTBEAT;B;02778ddf-b472-4e5d-807e-da8248d1b91f',
                    hearingRole: HearingRole.INTERPRETER,
                    firstName: 'Manual',
                    lastName: 'Interpreter 14',
                    username: 'manual.interpreter_14@hearings.reform.hmcts.net',
                    linkedParticipants: [
                        {
                            linkedId: '670d3f03-c406-485b-8d71-ea5e785bbf86',
                            linkedType: LinkType.Interpreter
                        }
                    ],
                    representee: ''
                },
                {
                    name: 'Mrs Manual Individual 27',
                    id: '55dcfc46-bc9f-4d9e-86c8-6067c9d8cda6',
                    status: ParticipantStatus.NotSignedIn,
                    displayName: 'C',
                    role: Role.Individual,
                    tiledDisplayName: 'CIVILIAN;NO_HEARTBEAT;C;55dcfc46-bc9f-4d9e-86c8-6067c9d8cda6',
                    hearingRole: HearingRole.APPELLANT,
                    firstName: 'Manual',
                    lastName: 'Individual 27',
                    username: 'manual.individual_27@hearings.reform.hmcts.net',
                    linkedParticipants: [],
                    representee: ''
                },
                {
                    id: 'judge1',
                    status: ParticipantStatus.Disconnected,
                    displayName: 'judge',
                    name: 'Judge',
                    firstName: 'Judge',
                    lastName: '',
                    username: 'judge@test.com',
                    role: Role.Judge,
                    tiledDisplayName: 'JUDGE;NO_HEARTBEAT;A;670d3f03-c406-485b-8d71-ea5e785bbf86',
                    hearingRole: HearingRole.JUDGE,
                    linkedParticipants: []
                }
            ];
            component.initParticipants();
            const interpreteeIndex = component.nonJudgeParticipants.findIndex(x => x.displayName === 'A');
            const interpreterIndex = component.nonJudgeParticipants.findIndex(x => x.displayName === 'B');
            expect(interpreterIndex).toEqual(interpreteeIndex + 1);

            const hasDuplicates = arr => {
                const set = new Set();
                return arr.some(el => {
                    if (set.has(el)) {
                        return true;
                    }
                    set.add(el);
                });
            };
            expect(hasDuplicates(component.nonJudgeParticipants) === false);
        });

        it('participant list should always have interpretee before each interpreter when multiple interpreters exist', () => {
            const interpretee1Index = component.nonJudgeParticipants.findIndex(
                x => x.hearingRole === HearingRole.LITIGANT_IN_PERSON && x.displayName === 'Interpretee'
            );

            const interpreter1Index = component.nonJudgeParticipants.findIndex(
                x => x.hearingRole === HearingRole.INTERPRETER && x.displayName === 'Interpreter'
            );

            const interpretee2Index = component.nonJudgeParticipants.findIndex(
                x => x.hearingRole === HearingRole.LITIGANT_IN_PERSON && x.displayName === 'Interpretee 2'
            );

            const interpreter2Index = component.nonJudgeParticipants.findIndex(
                x => x.hearingRole === HearingRole.INTERPRETER && x.displayName === 'Interpreter 2'
            );

            expect(interpreter1Index).toEqual(interpretee1Index + 1);
            expect(interpreter2Index).toEqual(interpretee2Index + 1);
        });

        it('getInterpreteeName should return the name of the interpretee given the interpreterId', () => {
            const interpreter = component.nonJudgeParticipants.find(
                x => x.hearingRole === HearingRole.INTERPRETER && x.displayName === 'Interpreter'
            );
            const interpretee = component.nonJudgeParticipants.find(
                x => x.hearingRole === HearingRole.LITIGANT_IN_PERSON && x.displayName === 'Interpretee'
            );
            const interpreteeName = component.getInterpreteeName(interpreter.id);

            expect(interpreteeName).toEqual(interpretee.name);
        });

        it('getInterpreteeName should return null when interpreter has no linked participants', () => {
            const interpreter = component.nonJudgeParticipants.find(
                x => x.hearingRole === HearingRole.INTERPRETER && x.displayName === 'Interpreter'
            );

            [null, []].forEach(linkedParticipants => {
                interpreter.linkedParticipants = linkedParticipants;
                const interpreteeName = component.getInterpreteeName(interpreter.id);
                expect(interpreteeName).toBeNull();
            });
        });

        it('getHearingRole should return Interpreter for when displaying an Interpreter with an Interpretee', () => {
            const interpreter = component.nonJudgeParticipants.find(
                x => x.hearingRole === HearingRole.INTERPRETER && x.displayName === 'Interpreter'
            );
            const interpretee = component.nonJudgeParticipants.find(
                x => x.hearingRole === HearingRole.LITIGANT_IN_PERSON && x.displayName === 'Interpretee'
            );
            const hearingRoleText = component.getHearingRole(interpreter);

            expect(hearingRoleText).toEqual(
                `hearing-role.interpreter wr-participant-list-shared.for <br><strong>${interpretee.name}</strong>`
            );
        });

        it('getHearingRole should return Interpreter when displaying an Interpreter without an Interpretee', () => {
            const interpreter = component.nonJudgeParticipants.find(
                x => x.hearingRole === HearingRole.INTERPRETER && x.displayName === 'Interpreter'
            );

            [null, []].forEach(linkedParticipants => {
                interpreter.linkedParticipants = linkedParticipants;

                const hearingRoleText = component.getHearingRole(interpreter);

                expect(hearingRoleText).toEqual('hearing-role.interpreter');
            });
        });

        it('getHearingRole should return contain Representative for when displaying a participant with Representee set and a case type set', () => {
            const representative = component.nonJudgeParticipants.find(x => x.hearingRole === HearingRole.REPRESENTATIVE);
            const hearingRoleText = component.getHearingRole(representative);

            expect(hearingRoleText).toEqual(
                `wr-participant-list-shared.representative wr-participant-list-shared.for <br><strong>${representative.representee}</strong>`
            );
        });

        it('getHearingRole should return contain the hearing role when displaying a participant', () => {
            const litigant = component.nonJudgeParticipants.find(x => x.hearingRole === HearingRole.LITIGANT_IN_PERSON);
            const hearingRoleText = component.getHearingRole(litigant);

            expect(hearingRoleText).toEqual('hearing-role.litigant-in-person');
        });

        it('getHearingRole should return contain the hearing role when displaying a participant', () => {
            // const participant = new ParticipantResponse();
            // participant.hearingRole = 'Quick link participant';
            const participant = jasmine.createSpyObj<VHParticipant>('VHParticipant', ['hearingRole']);
            participant.hearingRole = 'Quick link participant';

            const hearingRoleText = component.getHearingRole(participant);

            expect(hearingRoleText).toEqual('hearing-role.quick-link-participant');
        });

        it('getHearingRole should return contain the hearing role when displaying a participant', () => {
            // const participant = new ParticipantResponse();
            // participant.hearingRole = 'Quick link observer';
            const participant = jasmine.createSpyObj<VHParticipant>('VHParticipant', ['hearingRole']);
            participant.hearingRole = 'Quick link observer';
            const hearingRoleText = component.getHearingRole(participant);

            expect(hearingRoleText).toEqual('hearing-role.quick-link-observer');
        });
    });

    describe('initParticipants', () => {
        it('should filter and sort non-judge participants correctly', () => {
            conference.participants = new ConferenceTestData()
                .getFullListOfNonJudgeParticipants()
                .map(x => mapParticipantToVHParticipant(x));
            component.initParticipants();
            const nonJudgeParticipants = component.nonJudgeParticipants;

            const applicant1Index = nonJudgeParticipants.findIndex(x => x.name === 'Mr B Smith');
            const applicant2Index = nonJudgeParticipants.findIndex(x => x.name === 'Mr A Smith');
            const applicant3Index = nonJudgeParticipants.findIndex(x => x.name === 'Mr G Smith');
            const respondent1Index = nonJudgeParticipants.findIndex(x => x.name === 'Mr E Smith');
            const respondent2Index = nonJudgeParticipants.findIndex(x => x.name === 'Mr F Smith');
            const respondent3Index = nonJudgeParticipants.findIndex(x => x.name === 'Mr H Smith');
            const quickLinkParticipant1Index = nonJudgeParticipants.findIndex(x => x.name === 'Mr C Smith');
            const quickLinkParticipant2Index = nonJudgeParticipants.findIndex(x => x.name === 'Mr D Smith');

            expect(applicant1Index).toEqual(0);
            expect(applicant2Index).toEqual(1);
            // No longer sorting appellants and respondents as caseTypesGroups don't exist (arnt populated in real life) so order is more flexible
            const suitableIndicies = [2, 3, 4, 5];
            expect(suitableIndicies.includes(applicant3Index)).toBeTruthy();
            expect(suitableIndicies.includes(respondent1Index)).toBeTruthy();
            expect(suitableIndicies.includes(respondent2Index)).toBeTruthy();
            expect(suitableIndicies.includes(respondent3Index)).toBeTruthy();
            expect(quickLinkParticipant1Index).toEqual(6);
            expect(quickLinkParticipant2Index).toEqual(7);
        });

        it('should filter and sort panel members correctly', () => {
            conference.participants = new ConferenceTestData().getFullListOfPanelMembers().map(x => mapParticipantToVHParticipant(x));
            component.initParticipants();
            const panelMembers = component.panelMembers;

            const panelMember1Index = panelMembers.findIndex(x => x.name === 'Mr Panel Member A');
            const panelMember2Index = panelMembers.findIndex(x => x.name === 'Mr Panel Member B');

            expect(panelMember1Index).toEqual(0);
            expect(panelMember2Index).toEqual(1);
        });

        it('should filter and sort observers correctly', () => {
            conference.participants = new ConferenceTestData().getFullListOfObservers().map(x => mapParticipantToVHParticipant(x));
            component.initParticipants();
            const observers = component.observers;

            const observer1Index = observers.findIndex(x => x.name === 'Mr Observer A');
            const observer2Index = observers.findIndex(x => x.name === 'Mr Observer B');
            const qlObserver1Index = observers.findIndex(x => x.name === 'A QL Observer');
            const qlObserver2Index = observers.findIndex(x => x.name === 'QL Observer A');

            expect(observer1Index).toEqual(0);
            expect(observer2Index).toEqual(1);
            expect(qlObserver1Index).toEqual(2);
            expect(qlObserver2Index).toEqual(3);
        });

        it('should filter and sort endpoints correctly', () => {
            conference.endpoints = new ConferenceTestData().getFullListOfEndpoints().map(x => mapEndpointToVHEndpoint(x));
            component.initParticipants();
            const endpoints = component.endpoints;

            const endpoint1Index = endpoints.findIndex(x => x.displayName === 'Endpoint A');
            const endpoint2Index = endpoints.findIndex(x => x.displayName === 'Endpoint B');

            expect(endpoint1Index).toEqual(0);
            expect(endpoint2Index).toEqual(1);
        });

        it('should filter and sort staff members correctly', () => {
            conference.participants = new ConferenceTestData().getFullListOfStaffMembers().map(x => mapParticipantToVHParticipant(x));
            component.initParticipants();
            const staffMembers = component.staffMembers;

            const staffMember1Index = staffMembers.findIndex(x => x.name === 'A StaffMember');
            const staffMember2Index = staffMembers.findIndex(x => x.name === 'B StaffMember');
            const staffMember3Index = staffMembers.findIndex(x => x.name === 'C StaffMember');

            expect(staffMember1Index).toEqual(0);
            expect(staffMember2Index).toEqual(1);
            expect(staffMember3Index).toEqual(2);
        });

        it('should filter and sort wingers correctly', () => {
            conference.participants = new ConferenceTestData().getFullListOfWingers().map(x => mapParticipantToVHParticipant(x));
            component.initParticipants();
            const wingers = component.wingers;

            const winger1Index = wingers.findIndex(x => x.name === 'Mr A Winger');
            const winger2Index = wingers.findIndex(x => x.name === 'Mr B Winger');
            const winger3Index = wingers.findIndex(x => x.name === 'Mr C Winger');

            expect(winger1Index).toEqual(0);
            expect(winger2Index).toEqual(1);
            expect(winger3Index).toEqual(2);
        });
    });
});
