import { fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';

import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { RoomTransfer } from 'src/app/shared/models/room-transfer';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { consultationServiceSpyFactory } from 'src/app/testing/mocks/mock-consultation.service';
import { eventsServiceSpy, roomTransferSubjectMock } from 'src/app/testing/mocks/mock-events-service';
import { MockOidcSecurityService } from 'src/app/testing/mocks/mock-oidc-security.service';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { HearingRole } from '../../models/hearing-role-model';
import { WRParticipantStatusListDirective } from '../../waiting-room-shared/wr-participant-list-shared.component';
import { ParticipantListItem } from '../participant-list-item';
import { PrivateConsultationParticipantsComponent } from './private-consultation-participants.component';
import { FocusService } from 'src/app/services/focus.service';
import { VHConference, VHConsultationCallStatus, VHEndpoint, VHParticipant } from '../../store/models/vh-conference';
import { mapConferenceToVHConference, mapParticipantToVHParticipant } from '../../store/models/api-contract-to-state-model-mappers';
import { ConferenceState } from '../../store/reducers/conference.reducer';
import { createMockStore, MockStore } from '@ngrx/store/testing';
import * as ConferenceSelectors from '../../../waiting-space/store/selectors/conference.selectors';
import {
    ConferenceStatus,
    EndpointStatus,
    LoggedParticipantResponse,
    ParticipantResponse,
    ParticipantStatus,
    Role
} from 'src/app/services/clients/api-client';

describe('PrivateConsultationParticipantsComponent', () => {
    let component: PrivateConsultationParticipantsComponent;
    let conference: VHConference;
    const mockOidcSecurityService = new MockOidcSecurityService();
    const eventsService = eventsServiceSpy;
    let oidcSecurityService;
    let consultationService: jasmine.SpyObj<ConsultationService>;
    let logger: jasmine.SpyObj<Logger>;
    let videoWebService: jasmine.SpyObj<VideoWebService>;

    let logged: LoggedParticipantResponse;
    let activatedRoute: ActivatedRoute;
    let focusServiceSpy: jasmine.SpyObj<FocusService>;
    const translateService = translateServiceSpy;
    let mockConferenceStore: MockStore<ConferenceState>;

    beforeAll(() => {
        focusServiceSpy = jasmine.createSpyObj<FocusService>('FocusService', ['restoreFocus', 'storeFocus']);
        oidcSecurityService = mockOidcSecurityService;

        consultationService = consultationServiceSpyFactory();
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getObfuscatedName']);
        videoWebService.getObfuscatedName.and.returnValue('t***** u*****');

        logger = jasmine.createSpyObj<Logger>('Logger', ['debug', 'info', 'warn', 'event', 'error']);
    });

    beforeEach(() => {
        consultationService.consultationNameToString.calls.reset();
        conference = mapConferenceToVHConference(new ConferenceTestData().getConferenceDetailFuture());
        conference.participants.forEach(p => {
            p.status = ParticipantStatus.Available;
        });
        const judge = conference.participants.find(x => x.role === Role.Judge);

        mockConferenceStore = createMockStore({
            initialState: { currentConference: conference, availableRooms: [], consultationStatuses: [] }
        });

        mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, conference);
        mockConferenceStore.overrideSelector(ConferenceSelectors.getAvailableRooms, []);
        mockConferenceStore.overrideSelector(ConferenceSelectors.getConsultationStatuses, []);

        logged = new LoggedParticipantResponse({
            participant_id: judge.id,
            display_name: judge.displayName,
            role: Role.Judge
        });
        activatedRoute = <any>{
            snapshot: { data: { loggedUser: logged } }
        };

        component = new PrivateConsultationParticipantsComponent(
            consultationService,
            eventsService,
            logger,
            videoWebService,
            activatedRoute,
            translateService,
            focusServiceSpy,
            mockConferenceStore
        );

        component.conference = conference;
        component.participantEndpoints = [];

        component.loggedInUser = logged;
        component.ngOnInit();

        eventsService.getConsultationRequestResponseMessage.calls.reset();
        eventsService.getRequestedConsultationMessage.calls.reset();
        eventsService.getParticipantStatusMessage.calls.reset();
        eventsService.getParticipantStatusMessage.calls.reset();
    });

    afterEach(() => {
        component.ngOnDestroy();
        mockConferenceStore.resetSelectors();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return participant available', () => {
        const p = conference.participants[0];
        p.status = ParticipantStatus.Available;
        expect(component.isParticipantAvailable(p)).toEqual(true);
    });

    it('should return endpoint available', () => {
        const p = conference.endpoints[0];
        p.status = EndpointStatus.Connected;
        expect(component.isEndpointAvailable(p)).toEqual(true);
    });

    it('should return endpoint not available', () => {
        const p = conference.endpoints[0];
        p.status = EndpointStatus.Connected;
        conference.status = ConferenceStatus.InSession;
        expect(component.isEndpointAvailable(p)).toEqual(false);
    });

    it('should get joh consultation', () => {
        component.roomLabel = 'judgejohconsultationroom';
        expect(component.isJohConsultation()).toEqual(true);
    });

    it('should get private consultation', () => {
        component.roomLabel = 'participantconsultationroom134';
        expect(component.isPrivateConsultation()).toEqual(true);
    });

    it('should get yellow row classes', () => {
        component.roomLabel = 'test-room';
        const p = { room: { label: 'test-room', locked: false } } as VHParticipant;
        expect(component.getRowClasses(p)).toEqual('yellow');
    });

    it('should get row classes', () => {
        component.roomLabel = 'test-room';
        const p = { room: { label: 'test-room-2', locked: false } } as VHParticipant;
        expect(component.getRowClasses(p)).toEqual('');
    });

    it('should return can call participant', () => {
        component.roomLabel = 'test-room';

        const p = { status: ParticipantStatus.Available, room: { label: 'not-test-room', locked: false } } as VHParticipant;
        expect(component.canCallParticipant(p)).toBeTruthy();
    });

    it('should return can not call participant', () => {
        component.roomLabel = 'test-room';
        const p = { status: ParticipantStatus.Disconnected, room: { label: 'not-test-room', locked: false } } as VHParticipant;
        expect(component.canCallParticipant(p)).toBeFalsy();
    });

    it('should init participants on init', () => {
        component.ngOnInit();

        // Assert
        expect(component.nonJudgeParticipants.length).toBe(2);
        expect(component.judge).not.toBeNull();
        expect(component.endpoints.length).toBe(2);
        expect(component.observers.length).toBe(0);
        expect(component.panelMembers.length).toBe(0);
        expect(component.wingers.length).toBe(0);
    });

    it('should get participant call status', () => {
        component.roomLabel = 'Room1';

        const statusString = 'Transferring...';
        const participantId = 'Participant1';
        const participant = jasmine.createSpyObj<VHParticipant>('VHParticipant', ['id']);
        participant.id = participantId;
        component.participantCallStatuses.push({ participantId: participantId, callStatus: statusString } as VHConsultationCallStatus);

        const result = component.getParticipantCallStatus(participant);

        // Assert
        expect(result).toBe('Transferring...');
    });

    it('should get participant available if available', () => {
        component.roomLabel = 'Room1';
        const statuses = [
            [ParticipantStatus.None, false],
            [ParticipantStatus.NotSignedIn, false],
            [ParticipantStatus.UnableToJoin, false],
            [ParticipantStatus.Joining, false],
            [ParticipantStatus.Available, true],
            [ParticipantStatus.InHearing, false],
            [ParticipantStatus.InConsultation, true],
            [ParticipantStatus.None, false],
            [ParticipantStatus.None, false],
            [ParticipantStatus.Disconnected, false]
        ];
        statuses.forEach(([status, available]) => {
            const participant = jasmine.createSpyObj<VHParticipant>('VHParticipant', ['id', 'status']);
            participant.id = 'Participant1';
            participant.status = status as ParticipantStatus;

            const result = component.isParticipantAvailable(participant);

            // Assert
            expect(result).toBe(available as boolean);
        });
    });

    it('should get participant in current room', () => {
        component.roomLabel = 'Room1';

        const participant = jasmine.createSpyObj<VHParticipant>('VHParticipant', ['id', 'room']);
        participant.id = 'Participant1';
        participant.room = { label: 'Room1', locked: false };

        const result = component.isParticipantInCurrentRoom(participant);

        // Assert
        expect(result).toBeTrue();
    });

    it('should get participant in current different room', () => {
        component.roomLabel = 'Room1';
        const participant = jasmine.createSpyObj<VHParticipant>('VHParticipant', ['id', 'room']);
        participant.id = 'Participant1';
        participant.room = { label: 'Room2', locked: false };
        const result = component.isParticipantInCurrentRoom(participant);

        // Assert
        expect(result).toBeFalse();
    });

    it('should not get interpreter', () => {
        const participants = new ConferenceTestData().getListOfParticipants().map(x => mapParticipantToVHParticipant(x));
        const interpreter = participants[0];
        interpreter.hearingRole = HearingRole.INTERPRETER;
        const representative = participants[1];
        component.nonJudgeParticipants = [interpreter, representative];
        expect(component.getConsultationParticipants().length).toBe(1);
    });

    it('should not get witness', () => {
        component.roomLabel = 'participantconsultationroom134';
        const participants = new ConferenceTestData().getListOfParticipants().map(x => mapParticipantToVHParticipant(x));
        const witness = participants[0];
        witness.hearingRole = HearingRole.WITNESS;
        const representative = participants[1];
        component.nonJudgeParticipants = [witness, representative];
        expect(component.getConsultationParticipants().length).toBe(1);
    });

    it('should not get expert', () => {
        component.roomLabel = 'participantconsultationroom134';
        const participants = new ConferenceTestData().getListOfParticipants().map(x => mapParticipantToVHParticipant(x));
        const expert = participants[0];
        expert.hearingRole = HearingRole.EXPERT;
        const representative = participants[1];
        component.nonJudgeParticipants = [expert, representative];
        expect(component.getConsultationParticipants().length).toBe(1);
    });

    it('should sort quick link participants', () => {
        const testData = new ConferenceTestData();
        component.conference.participants = [
            mapParticipantToVHParticipant(testData.quickLinkParticipant2),
            mapParticipantToVHParticipant(testData.quickLinkParticipant1)
        ];
        component.initParticipants();
        const participants = component.getConsultationParticipants();

        expect(participants.length).toBe(2);
        expect(participants.find(x => x.displayName === testData.quickLinkParticipant1.display_name)).toBeTruthy();
        expect(participants.find(x => x.displayName === testData.quickLinkParticipant2.display_name)).toBeTruthy();
        expect(participants.findIndex(x => x.displayName === testData.quickLinkParticipant1.display_name)).toBeLessThan(
            participants.findIndex(x => x.displayName === testData.quickLinkParticipant2.display_name)
        );
    });

    describe('canCallEndpoint', () => {
        it('should return can call endpoint', () => {
            // Not in current room
            component.roomLabel = 'test-room';
            const endpoint = conference.endpoints[0];
            const vhEndpoint = {
                id: endpoint.id,
                status: EndpointStatus.Connected,
                room: { label: 'not-test-room', locked: false }
            } as VHEndpoint;

            // Has permissions
            component.participantEndpoints.push({ id: endpoint.id } as VHEndpoint);

            expect(component.canCallEndpoint(vhEndpoint)).toBeTrue();
        });

        it('should return can not call endpoint - same room', () => {
            // Not in current room
            component.roomLabel = 'test-room';
            const endpoint = conference.endpoints[0];
            const vhEndpoint = {
                id: endpoint.id,
                status: EndpointStatus.Connected,
                room: { label: 'test-room', locked: false }
            } as VHEndpoint;

            // Has permissions
            component.participantEndpoints.push({ id: endpoint.id } as VHEndpoint);

            expect(component.canCallEndpoint(vhEndpoint)).toBeFalse();
        });

        it('should return can not call endpoint - not available', () => {
            // Not in current room
            component.roomLabel = 'test-room';
            const endpoint = conference.endpoints[0];
            const vhEndpoint = {
                id: endpoint.id,
                status: EndpointStatus.Disconnected,
                room: { label: 'not-test-room', locked: false }
            } as VHEndpoint;

            // Has permissions
            component.participantEndpoints.push({ id: endpoint.id } as VHEndpoint);

            expect(component.canCallEndpoint(vhEndpoint)).toBeFalse();
        });

        it('should return can not call endpoint - when conference is started', () => {
            // In current room
            const roomLabel = 'test-room';
            const endpoint = conference.endpoints[0];
            component.roomLabel = roomLabel;
            const vhEndpoint = {
                id: endpoint.id,
                status: EndpointStatus.Connected,
                room: { label: roomLabel, locked: false }
            } as VHEndpoint;

            conference.status = ConferenceStatus.InSession;

            // Has permissions
            component.participantEndpoints.push({ id: endpoint.id } as VHEndpoint);

            expect(component.canCallEndpoint(vhEndpoint)).toBeFalse();
        });

        it('should return can not call endpoint - not defense advocate', () => {
            const roomLabel = 'test-room';
            const endpoint = conference.endpoints[0];
            component.roomLabel = roomLabel;
            const vhEndpoint = {
                id: endpoint.id,
                status: EndpointStatus.Connected,
                room: { label: roomLabel, locked: false }
            } as VHEndpoint;

            conference.status = ConferenceStatus.InSession;

            // Has not got permissions to call endpoint
            component.participantEndpoints = [];

            expect(component.canCallEndpoint(vhEndpoint)).toBeFalse();
        });
    });

    it('should return participant status', () => {
        const participantItem = jasmine.createSpyObj<ParticipantListItem>('ParticipantListItem', ['status']);
        participantItem.status = ParticipantStatus.Available;
        expect(component.trackParticipant(0, participantItem)).toBe(ParticipantStatus.Available);
    });

    describe('johGroups', () => {
        it('should return correct participants mapped to ParticipantListItem', () => {
            const testPanelMember1 = jasmine.createSpyObj<ParticipantListItem>('ParticipantListItem', ['id', 'name']);
            testPanelMember1.id = 'TestPanelMember1Id';
            testPanelMember1.name = 'TestPanelMember1Name';
            const expectedPanelMember1: ParticipantListItem = { ...testPanelMember1 };

            const testPanelMember2 = jasmine.createSpyObj<ParticipantListItem>('ParticipantListItem', ['id', 'name']);
            testPanelMember2.id = 'TestPanelMember2Id';
            testPanelMember2.name = 'TestPanelMember2Name';
            const expectedPanelMember2: ParticipantListItem = { ...testPanelMember2 };

            const testPanelMembers = [testPanelMember1, testPanelMember2];
            const expectedPanelMembers = [expectedPanelMember1, expectedPanelMember2];

            const testWinger1 = jasmine.createSpyObj<ParticipantListItem>('ParticipantListItem', ['id', 'name']);
            testWinger1.id = 'TestWinger1Id';
            testWinger1.name = 'TestWinger1Name';
            const expectedWinger1: ParticipantListItem = { ...testWinger1 };

            const testWinger2 = jasmine.createSpyObj<ParticipantListItem>('ParticipantListItem', ['id', 'name']);
            testWinger2.id = 'TestWinger2Id';
            testWinger2.name = 'TestWinger2Name';
            const expectedWinger2: ParticipantListItem = { ...testWinger2 };

            const testWingers = [testWinger1, testWinger2];
            const expectedWingers = [expectedWinger1, expectedWinger2];

            component.panelMembers = testPanelMembers;
            component.wingers = testWingers;

            component.setJohGroupResult();
            const mappedGroups = component.johGroupResult;
            const mappedPanelMembers = mappedGroups[0];
            const mappedWingers = mappedGroups[1];

            expect(mappedPanelMembers).toEqual(expectedPanelMembers);
            expect(mappedWingers).toEqual(expectedWingers);
        });
    });

    describe('johGroups - handleParticipantStatusChange', () => {
        let superSpy: jasmine.SpyObj<any>;
        let johGroupSpy: jasmine.SpyObj<any>;

        beforeEach(() => {
            superSpy = spyOn(WRParticipantStatusListDirective.prototype, 'handleParticipantStatusChange');
            johGroupSpy = spyOn(component, 'setJohGroupResult');
        });

        it('should handle participant status messages', fakeAsync(() => {
            const message = {} as ParticipantStatusMessage;
            component.handleParticipantStatusChange(message);
            tick();
            expect(superSpy).toHaveBeenCalledTimes(1);
            expect(johGroupSpy).toHaveBeenCalledTimes(1);
            expect(superSpy).toHaveBeenCalledWith(message);
        }));
    });

    describe('initParticipants', () => {
        let superSpy: jasmine.SpyObj<any>;
        let johGroupSpy: jasmine.SpyObj<any>;

        beforeEach(() => {
            superSpy = spyOn(WRParticipantStatusListDirective.prototype, 'initParticipants');
            johGroupSpy = spyOn(component, 'setJohGroupResult');
        });

        it('should initialize participants', () => {
            component.initParticipants();
            expect(superSpy).toHaveBeenCalledTimes(1);
            expect(johGroupSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('handleRoomChange', () => {
        let superSpy: jasmine.SpyObj<any>;
        let johGroupSpy: jasmine.SpyObj<any>;
        const message = {} as RoomTransfer;

        beforeEach(() => {
            superSpy = spyOn<any>(WRParticipantStatusListDirective.prototype, 'filterNonJudgeParticipants');
            johGroupSpy = spyOn(component, 'setJohGroupResult');
        });

        it('should handle room change message', () => {
            component.handleRoomChange(message);
            expect(johGroupSpy).toHaveBeenCalledTimes(1);
            expect(superSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('room transfer event', () => {
        let handleRoomChangeSpy: jasmine.SpyObj<any>;
        const message = {} as RoomTransfer;

        beforeEach(() => {
            handleRoomChangeSpy = spyOn(component, 'handleRoomChange');
        });

        it('should handle room change message', fakeAsync(() => {
            roomTransferSubjectMock.next(message);
            tick();
            expect(handleRoomChangeSpy).toHaveBeenCalledTimes(1);
        }));
    });

    describe('getObservers', () => {
        const litigantInPerson = mapParticipantToVHParticipant(
            new ParticipantResponse({
                id: 'litigantInPerson_id',
                status: ParticipantStatus.Available,
                display_name: 'litigantInPerson_display_name',
                role: Role.Individual,
                representee: 'litigantInPerson_representee',
                tiled_display_name: 'litigantInPerson_tiledDisplayName',
                hearing_role: HearingRole.LITIGANT_IN_PERSON,
                linked_participants: []
            })
        );

        const witness1 = mapParticipantToVHParticipant(
            new ParticipantResponse({
                id: 'witness1_id',
                status: ParticipantStatus.Available,
                display_name: 'witness1_display_name',
                role: Role.Individual,
                representee: 'witness1_representee',
                tiled_display_name: 'witness1_tiledDisplayName',
                hearing_role: HearingRole.WITNESS,
                linked_participants: []
            })
        );

        const witness2 = mapParticipantToVHParticipant(
            new ParticipantResponse({
                id: 'witness2_id',
                status: ParticipantStatus.Available,
                display_name: 'witness2_display_name',
                role: Role.Individual,
                representee: 'witness2_representee',
                tiled_display_name: 'witness2_tiledDisplayName',
                hearing_role: HearingRole.WITNESS,
                linked_participants: []
            })
        );

        const regularObserver = mapParticipantToVHParticipant(
            new ParticipantResponse({
                id: 'regularObserver_id',
                status: ParticipantStatus.Available,
                display_name: 'regularObserver_display_name',
                role: Role.Individual,
                representee: 'regularObserver_representee',
                tiled_display_name: 'regularObserver_tiledDisplayName',
                hearing_role: HearingRole.OBSERVER,
                linked_participants: []
            })
        );

        const quickLinkObserver1 = mapParticipantToVHParticipant(
            new ParticipantResponse({
                id: 'quickLinkObserver1_id',
                status: ParticipantStatus.Available,
                display_name: 'quickLinkObserver1_display_name',
                role: Role.QuickLinkObserver,
                representee: 'quickLinkObserver1_representee',
                tiled_display_name: 'quickLinkObserver1_tiledDisplayName',
                hearing_role: HearingRole.QUICK_LINK_OBSERVER,
                linked_participants: []
            })
        );

        const quickLinkObserver2 = mapParticipantToVHParticipant(
            new ParticipantResponse({
                id: 'quickLinkObserver2_id',
                status: ParticipantStatus.Available,
                display_name: 'quickLinkObserver2_display_name',
                role: Role.QuickLinkObserver,
                representee: 'quickLinkObserver2_representee',
                tiled_display_name: 'quickLinkObserver2_tiledDisplayName',
                hearing_role: HearingRole.QUICK_LINK_OBSERVER,
                linked_participants: []
            })
        );

        const testParticipants = [litigantInPerson, witness2, witness1];
        const testObservers = [regularObserver, quickLinkObserver2, quickLinkObserver1];

        beforeEach(() => {
            conference.participants = testParticipants.concat(testObservers);
            component.initParticipants();
        });

        it('should return nothing if is not joh consultation', () => {
            spyOn(component, 'isJohConsultation').and.returnValue(false);
            const result = component.getObservers();
            expect(result).toEqual([]);
        });

        it('should return list in correct order for joh consultation', () => {
            spyOn(component, 'isJohConsultation').and.returnValue(true);
            const result = component.getObservers();

            const observer1Index = result.findIndex(x => x.displayName === 'regularObserver_display_name');
            const qlObserver1Index = result.findIndex(x => x.displayName === 'quickLinkObserver1_display_name');
            const qlObserver2Index = result.findIndex(x => x.displayName === 'quickLinkObserver2_display_name');

            expect(observer1Index).toEqual(0);
            expect(qlObserver1Index).toEqual(1);
            expect(qlObserver2Index).toEqual(2);

            expect(result.length).toBe(testObservers.length);
        });
    });

    describe('getPrivateConsultationParticipants', () => {
        beforeEach(() => {
            conference.participants = new ConferenceTestData()
                .getFullListOfNonJudgeParticipants()
                .map(x => mapParticipantToVHParticipant(x));
            component.initParticipants();
        });

        it('should return list in correct order', () => {
            component.roomLabel = 'participantconsultationroom124';
            const privateConsultationParticipants = component.getConsultationParticipants();

            const applicant1Index = privateConsultationParticipants.findIndex(x => x.name === 'Mr B Smith');
            const applicant2Index = privateConsultationParticipants.findIndex(x => x.name === 'Mr A Smith'); // interpreter
            const applicant3Index = privateConsultationParticipants.findIndex(x => x.name === 'Mr G Smith'); // witness
            const respondent1Index = privateConsultationParticipants.findIndex(x => x.name === 'Mr E Smith'); // witness
            const respondent2Index = privateConsultationParticipants.findIndex(x => x.name === 'Mr F Smith');
            const respondent3Index = privateConsultationParticipants.findIndex(x => x.name === 'Mr H Smith'); // interpreter
            const quickLinkParticipant1Index = privateConsultationParticipants.findIndex(x => x.name === 'Mr C Smith');
            const quickLinkParticipant2Index = privateConsultationParticipants.findIndex(x => x.name === 'Mr D Smith');

            // Interpreters and Witnesses are filtered out
            expect(applicant2Index).toEqual(-1);
            expect(respondent3Index).toEqual(-1);
            expect(applicant3Index).toEqual(-1);
            expect(respondent1Index).toEqual(-1);

            // correct ordering
            expect(applicant1Index).toEqual(0);
            expect(respondent2Index).toEqual(1);
            expect(quickLinkParticipant1Index).toEqual(2);
            expect(quickLinkParticipant2Index).toEqual(3);
        });
    });

    describe('participantHasInviteRestrictions', () => {
        it('should return false if user is not judical, and participant is allowed to be invited', () => {
            // arrange
            component.loggedInUser.role = Role.Individual;
            const vhParticipant = component.conference.participants.find(x => x.role === Role.Individual);
            vhParticipant.hearingRole = HearingRole.APPELLANT;
            component.initParticipants();
            const participant = component.getConsultationParticipants().find(x => x.id === vhParticipant.id);
            // act
            const result = component.participantHasInviteRestrictions(participant);
            // Assert
            expect(result).toBeFalse();
        });
    });
});
