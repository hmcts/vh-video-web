import { fakeAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import {
    ConferenceResponse,
    EndpointStatus,
    LoggedParticipantResponse,
    ParticipantResponseVho,
    ParticipantStatus,
    Role,
    RoomSummaryResponse
} from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { consultationServiceSpyFactory } from 'src/app/testing/mocks/mock-consultation.service';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { VideoWebService } from '../../services/api/video-web.service';
import { Logger } from '../../services/logging/logger-base';
import { HearingRole } from '../models/hearing-role-model';
import { JudgeParticipantStatusListComponent } from './judge-participant-status-list.component';
import { FocusService } from 'src/app/services/focus.service';
import * as exp from 'constants';
import { VHConference } from '../store/models/vh-conference';
import { mapConferenceToVHConference, mapParticipantToVHParticipant } from '../store/models/api-contract-to-state-model-mappers';

describe('JudgeParticipantStatusListComponent', () => {
    const testData = new ConferenceTestData();

    let component: JudgeParticipantStatusListComponent;
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    let consultationService: jasmine.SpyObj<ConsultationService>;
    const eventsService = eventsServiceSpy;
    const logger: Logger = new MockLogger();
    let conference: VHConference;
    let activatedRoute: ActivatedRoute;
    const translateService = translateServiceSpy;
    let focusServiceSpy: jasmine.SpyObj<FocusService>;
    let editedStaffMember;

    beforeAll(() => {
        focusServiceSpy = jasmine.createSpyObj<FocusService>('FocusService', ['restoreFocus', 'storeFocus']);
        consultationService = consultationServiceSpyFactory();
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['updateParticipantDisplayName', 'getObfuscatedName']);
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
        conference = mapConferenceToVHConference(testData.getConferenceDetailNow());
        const participantObserverPanelMember = testData
            .getListOfParticipantsObserverAndPanelMembers()
            .map(x => mapParticipantToVHParticipant(x));
        participantObserverPanelMember.forEach(x => conference.participants.push(x));
        const participantWinger = new ConferenceTestData().getListOfParticipantsWingers().map(x => mapParticipantToVHParticipant(x));
        participantWinger.forEach(x => conference.participants.push(x));
        component = new JudgeParticipantStatusListComponent(
            consultationService,
            eventsService,
            logger,
            videoWebService,
            activatedRoute,
            translateService,
            focusServiceSpy
        );
        component.conference = conference;
        component.ngOnInit();
        editedStaffMember = conference.participants.find(p => p.hearingRole === HearingRole.STAFF_MEMBER);
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
        expect(component.staffMembers[0].displayName).toBe(
            testData.getListOfParticipantDetails().find(p => p.hearing_role === HearingRole.STAFF_MEMBER).display_name
        );

        expect(component.wingers).toBeDefined();
        expect(component.wingers.length).toBe(1);

        expect(component.endpoints).toBeDefined();
        expect(component.endpoints.length).toBe(2);

        expect(component.participantCount).toBe(7);
    });

    it('should show input template for change judge display name', () => {
        component.changeJudgeNameShow();
        expect(component.showChangeJudgeDisplayName).toBe(true);
        expect(component.newJudgeDisplayName).toBe(component.judge.displayName);
        expect(focusServiceSpy.storeFocus).toHaveBeenCalled();
    });

    it('should hide input template for change judge display name', () => {
        component.cancelJudgeDisplayName();
        expect(component.showChangeJudgeDisplayName).toBe(false);
        expect(focusServiceSpy.restoreFocus).toHaveBeenCalled();
    });

    it('should show input template for change staff member display name', () => {
        component.isStaffMember = true;
        component.loggedInUser.participant_id = editedStaffMember.id;
        component.changeStaffMemberNameShow(editedStaffMember.id);

        expect(component.showChangeStaffMemberDisplayName).toBe(true);
        expect(component.canChangeStaffMemberName(editedStaffMember.id)).toBe(true);
        expect(component.newStaffMemberDisplayName).toBe(component.staffMembers.find(p => p.id === editedStaffMember.id).displayName);
        expect(focusServiceSpy.storeFocus).toHaveBeenCalled();
    });

    it('should not show input template for changing staff member display name if for a different staff member', () => {
        const participant5 = mapParticipantToVHParticipant(
            new ParticipantResponseVho({
                id: 'FRGT1318-4965-49AF-A887-DED64554429T',
                name: 'Staff Member name 2',
                status: ParticipantStatus.Available,
                role: Role.StaffMember,
                display_name: 'Staff Member display name 2',
                case_type_group: 'Staff Member',
                tiled_display_name: 'Staff Member 2;Staff Member 2;9F681318-4965-49AF-A887-DED64554429T',
                hearing_role: HearingRole.STAFF_MEMBER,
                current_room: new RoomSummaryResponse({ label: 'ParticipantConsultationRoom1' }),
                linked_participants: []
            })
        );
        component.conference.participants.push(participant5);
        const user = conference.participants.find(p => p.hearingRole === HearingRole.STAFF_MEMBER && p.id !== editedStaffMember.id);
        component.loggedInUser = new LoggedParticipantResponse({
            participant_id: user.id,
            display_name: user.displayName,
            role: user.role,
            admin_username: user.username
        });

        expect(component.canChangeStaffMemberName(editedStaffMember.id)).toBe(false);
    });

    it('should hide input template for change judge display name', () => {
        component.cancelStaffMemberDisplayName();
        expect(component.showChangeStaffMemberDisplayName).toBe(false);
        expect(focusServiceSpy.restoreFocus).toHaveBeenCalled();
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
        expect(component.judge.displayName).toBe(newName);
        expect(component.showChangeJudgeDisplayName).toBe(false);
        expect(videoWebService.updateParticipantDisplayName).toHaveBeenCalledTimes(1);
        expect(focusServiceSpy.restoreFocus).toHaveBeenCalled();
    });

    it('should return name with alphanumeric characters', async () => {
        // Given
        const newName = 'new name%$*^^';

        // When
        const result = component.removeSpecialCharacters(newName);

        // Then
        expect(result).toBe('new name');
    });

    it('should log error when unable to save new judge name', async () => {
        const error = { error: 'test failure' };
        const newName = 'new name';
        component.onEnterJudgeDisplayName(newName);
        videoWebService.updateParticipantDisplayName.and.rejectWith(error);
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
        videoWebService.updateParticipantDisplayName.calls.reset();
        const newName = 'new name';
        component.onEnterStaffMemberDisplayName(newName);
        await component.saveStaffMemberDisplayName(editedStaffMember.id);
        expect(component.staffMembers.find(p => p.id === editedStaffMember.id).displayName).toBe(newName);
        expect(component.showChangeStaffMemberDisplayName).toBe(false);
        expect(videoWebService.updateParticipantDisplayName).toHaveBeenCalledTimes(1);
        expect(focusServiceSpy.restoreFocus).toHaveBeenCalled();
    });

    it('should log error when unable to save new staff member name', async () => {
        const error = { error: 'test failure' };
        const newName = 'new name';
        component.onEnterStaffMemberDisplayName(newName);
        videoWebService.updateParticipantDisplayName.and.rejectWith(error);
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
            translateService,
            focusServiceSpy
        );
        component.conference = conference;
        component.ngOnInit();
        expect(component.isUserJudge).toBeTruthy();
    }));
});
