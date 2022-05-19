import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    AllowedEndpointResponse,
    ConferenceResponse,
    ConsultationAnswer,
    EndpointResponse,
    EndpointState,
    EndpointStatus,
    LoggedParticipantResponse,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    RoomSummaryResponse
} from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConsultationRequestResponseMessage } from 'src/app/services/models/consultation-request-response-message';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { RequestedConsultationMessage } from 'src/app/services/models/requested-consultation-message';
import { RoomTransfer } from 'src/app/shared/models/room-transfer';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { consultationServiceSpyFactory } from 'src/app/testing/mocks/mock-consultation.service';
import {
    consultationRequestResponseMessageSubjectMock,
    eventsServiceSpy,
    participantStatusSubjectMock,
    requestedConsultationMessageSubjectMock,
    roomTransferSubjectMock
} from 'src/app/testing/mocks/mock-events-service';
import { MockOidcSecurityService } from 'src/app/testing/mocks/mock-oidc-security.service';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { HearingRole } from '../../models/hearing-role-model';
import { WRParticipantStatusListDirective } from '../../waiting-room-shared/wr-participant-list-shared.component';
import { ParticipantListItem } from '../participant-list-item';
import { PrivateConsultationParticipantsComponent } from './private-consultation-participants.component';

describe('PrivateConsultationParticipantsComponent', () => {
    let component: PrivateConsultationParticipantsComponent;
    let conference: ConferenceResponse;
    const mockOidcSecurityService = new MockOidcSecurityService();
    const eventsService = eventsServiceSpy;
    let oidcSecurityService;
    let consultationService: jasmine.SpyObj<ConsultationService>;
    let logger: jasmine.SpyObj<Logger>;
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    const invitationId = 'invitation-id';

    let logged: LoggedParticipantResponse;
    let activatedRoute: ActivatedRoute;
    const translateService = translateServiceSpy;

    beforeAll(() => {
        oidcSecurityService = mockOidcSecurityService;

        consultationService = consultationServiceSpyFactory();
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getObfuscatedName']);
        videoWebService.getObfuscatedName.and.returnValue('t***** u*****');

        logger = jasmine.createSpyObj<Logger>('Logger', ['debug', 'info', 'warn', 'event', 'error']);
    });

    beforeEach(() => {
        consultationService.consultationNameToString.calls.reset();
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
        activatedRoute = <any>{
            snapshot: { data: { loggedUser: logged } }
        };
        component = new PrivateConsultationParticipantsComponent(
            consultationService,
            eventsService,
            logger,
            videoWebService,
            activatedRoute,
            translateService
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
        expect(component.isParticipantAvailable(p)).toEqual(true);
    });

    it('should get joh consultation', () => {
        component.roomLabel = 'judgejohconsultationroom';
        expect(component.isJohConsultation()).toEqual(true);
    });

    it('should get private consultation', () => {
        component.roomLabel = 'test-room';
        expect(component.isJohConsultation()).toEqual(false);
    });

    it('should get yellow row classes', () => {
        component.roomLabel = 'test-room';
        const p = conference.participants[0];
        p.current_room.label = 'test-room';
        expect(component.getRowClasses(p)).toEqual('yellow');
    });

    it('should get row classes', () => {
        component.roomLabel = 'test-room';
        const p = conference.participants[0];
        p.current_room.label = 'test-room-two';
        expect(component.getRowClasses(p)).toEqual('');
    });

    it('should return can call participant', () => {
        component.roomLabel = 'test-room';
        const p = conference.participants[0];
        p.status = ParticipantStatus.Available;
        p.current_room.label = 'not-test-room';
        expect(component.canCallParticipant(p)).toBeTruthy();
    });

    it('should return can not call participant', () => {
        component.roomLabel = 'test-room';
        const p = conference.participants[0];
        p.status = ParticipantStatus.Disconnected;
        p.current_room.label = 'test-room';
        expect(component.canCallParticipant(p)).toBeFalsy();
    });

    it('should setup subscribers on init', () => {
        component.ngOnInit();

        // Assert
        expect(eventsService.getConsultationRequestResponseMessage).toHaveBeenCalledTimes(1);
        expect(eventsService.getRequestedConsultationMessage).toHaveBeenCalledTimes(1);
        expect(eventsService.getParticipantStatusMessage).toHaveBeenCalledTimes(2);
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

    it('should set answer on response message', () => {
        component.roomLabel = 'Room1';
        consultationRequestResponseMessageSubjectMock.next(
            new ConsultationRequestResponseMessage(conference.id, invitationId, 'Room1', 'Participant1', ConsultationAnswer.Rejected)
        );

        // Assert
        expect(component.participantCallStatuses['Participant1']).toBe('Rejected');
    });

    it('should not set answer if different room', () => {
        component.roomLabel = 'Room1';
        consultationRequestResponseMessageSubjectMock.next(
            new ConsultationRequestResponseMessage(conference.id, 'Room2', 'Participant1', ConsultationAnswer.Rejected)
        );

        // Assert
        expect(component.participantCallStatuses['Participant1']).toBeUndefined();
    });

    it('should not set answer if different conference', () => {
        component.roomLabel = 'Room1';
        consultationRequestResponseMessageSubjectMock.next(
            new ConsultationRequestResponseMessage(
                'IncorrectConferenceId',
                invitationId,
                'Room1',
                'Participant1',
                ConsultationAnswer.Rejected
            )
        );

        // Assert
        expect(component.participantCallStatuses['Participant1']).toBeUndefined();
    });

    it('should set answer on response message then reset after timeout', fakeAsync(() => {
        component.roomLabel = 'Room1';
        consultationRequestResponseMessageSubjectMock.next(
            new ConsultationRequestResponseMessage(conference.id, invitationId, 'Room1', 'Participant1', ConsultationAnswer.Rejected)
        );
        flushMicrotasks();

        // Assert
        expect(component.participantCallStatuses['Participant1']).toBe('Rejected');
        tick(10000);
        expect(component.participantCallStatuses['Participant1']).toBeNull();
    }));

    it('should a 2nd call after answering should prevent timeout call', fakeAsync(() => {
        component.roomLabel = 'Room1';
        consultationRequestResponseMessageSubjectMock.next(
            new ConsultationRequestResponseMessage(conference.id, invitationId, 'Room1', 'Participant1', ConsultationAnswer.Rejected)
        );
        flushMicrotasks();
        tick(2000);
        requestedConsultationMessageSubjectMock.next(
            new RequestedConsultationMessage(conference.id, invitationId, 'Room1', 'Participant2', 'Participant1')
        );
        tick(9000);

        // Assert
        expect(component.participantCallStatuses['Participant1']).toBe('Calling');
    }));

    it('should not set calling if different room', () => {
        component.roomLabel = 'Room1';
        requestedConsultationMessageSubjectMock.next(
            new RequestedConsultationMessage(conference.id, invitationId, 'Room2', 'Participant2', 'Participant1')
        );

        // Assert
        expect(component.participantCallStatuses['Participant1']).toBeUndefined();
    });

    it('should not set calling if different conference', () => {
        component.roomLabel = 'Room1';
        requestedConsultationMessageSubjectMock.next(
            new RequestedConsultationMessage('IncorrectConferenceId', invitationId, 'Room1', 'Participant2', 'Participant1')
        );

        // Assert
        expect(component.participantCallStatuses['Participant1']).toBeUndefined();
    });

    it('should reset participant call status on status message', () => {
        component.roomLabel = 'Room1';
        requestedConsultationMessageSubjectMock.next(
            new RequestedConsultationMessage(conference.id, invitationId, 'Room1', 'Participant2', 'Participant1')
        );
        participantStatusSubjectMock.next(
            new ParticipantStatusMessage('Participant1', 'Username', conference.id, ParticipantStatus.Disconnected)
        );

        // Assert
        expect(component.participantCallStatuses['Participant1']).toBeNull();
    });

    it('should get participant status', () => {
        component.roomLabel = 'Room1';
        const allStatuses = Object.values(ParticipantStatus);
        allStatuses.forEach(status => {
            const statusString = status.toString();
            const participantId = 'Participant1';
            const participant = new ParticipantResponse({
                id: participantId
            });
            component.participantCallStatuses[participantId] = statusString;

            const result = component.getParticipantStatus(participant);

            // Assert
            expect(result).toBe(statusString);
        });
    });

    it('should get endpoint status', () => {
        component.roomLabel = 'Room1';
        const allStatuses = Object.values(EndpointState);
        allStatuses.forEach(status => {
            const statusString = status.toString();
            const endpointId = 'Endpoint1';
            const endpoint = new EndpointResponse({
                id: endpointId
            });
            component.participantCallStatuses[endpointId] = statusString;

            const result = component.getParticipantStatus(endpoint);

            // Assert
            expect(result).toBe(statusString);
        });
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
            const participant = new ParticipantResponse({
                id: 'Participant1',
                status: status as ParticipantStatus
            });

            const result = component.isParticipantAvailable(participant);

            // Assert
            expect(result).toBe(available as boolean);
        });
    });

    it('should get participant in current room', () => {
        component.roomLabel = 'Room1';
        const participant = new ParticipantResponse({
            id: 'Participant1',
            current_room: {
                label: 'Room1'
            } as RoomSummaryResponse
        });

        const result = component.isParticipantInCurrentRoom(participant);

        // Assert
        expect(result).toBeTrue();
    });

    it('should get participant in current different room', () => {
        component.roomLabel = 'Room1';
        const participant = new ParticipantResponse({
            id: 'Participant1',
            current_room: {
                label: 'Room2'
            } as RoomSummaryResponse
        });

        const result = component.isParticipantInCurrentRoom(participant);

        // Assert
        expect(result).toBeFalse();
    });

    it('should not get interpreter', () => {
        const participants = new ConferenceTestData().getListOfParticipants();
        const interpreter = participants[0];
        interpreter.hearing_role = HearingRole.INTERPRETER;
        const representative = participants[1];
        component.nonJudgeParticipants = [interpreter, representative];
        expect(component.getPrivateConsultationParticipants().length).toBe(1);
    });

    it('should sort quick link participants', () => {
        const testData = new ConferenceTestData();
        component.conference.participants = [testData.quickLinkParticipant2, testData.quickLinkParticipant1];
        component.initParticipants();
        const participants = component.getPrivateConsultationParticipants();

        expect(participants.length).toBe(2);
        expect(participants.find(x => x.display_name === testData.quickLinkParticipant1.display_name)).toBeTruthy();
        expect(participants.find(x => x.display_name === testData.quickLinkParticipant2.display_name)).toBeTruthy();
        expect(participants.findIndex(x => x.display_name === testData.quickLinkParticipant1.display_name)).toBeLessThan(
            participants.findIndex(x => x.display_name === testData.quickLinkParticipant2.display_name)
        );
    });

    it('should return can call endpoint', () => {
        // Not in current room
        component.roomLabel = 'test-room';
        const endpoint = conference.endpoints[0];
        endpoint.current_room.label = 'not-test-room';

        // Available
        endpoint.status = EndpointStatus.Connected;

        // Room doesnt contain another endpount
        conference.endpoints[1].current_room.label = 'not-test-room';

        // Has permissions
        component.participantEndpoints.push({ id: endpoint.id } as AllowedEndpointResponse);

        expect(component.canCallEndpoint(endpoint)).toBeTrue();
    });

    it('should return can not call endpoint - same room', () => {
        // Not in current room
        component.roomLabel = 'test-room';
        const endpoint = conference.endpoints[0];
        endpoint.current_room.label = 'test-room';

        // Available
        endpoint.status = EndpointStatus.Connected;

        // Room doesnt contain another endpount
        conference.endpoints[1].current_room.label = 'not-test-room';

        // Has permissions
        component.participantEndpoints.push({ id: endpoint.id } as AllowedEndpointResponse);

        expect(component.canCallEndpoint(endpoint)).toBeFalse();
    });

    it('should return can not call endpoint - not available', () => {
        // Not in current room
        component.roomLabel = 'test-room';
        const endpoint = conference.endpoints[0];
        endpoint.current_room.label = 'not-test-room';

        // Available
        endpoint.status = EndpointStatus.Disconnected;

        // Room doesnt contain another endpount
        conference.endpoints[1].current_room.label = 'not-test-room';

        // Has permissions
        component.participantEndpoints.push({ id: endpoint.id } as AllowedEndpointResponse);

        expect(component.canCallEndpoint(endpoint)).toBeFalse();
    });

    it('should return can not call endpoint - when endpoint is already in the room', () => {
        // In current room
        const roomLabel = 'test-room';
        const endpoint = conference.endpoints[0];
        component.roomLabel = endpoint.current_room.label = roomLabel;

        // Available
        endpoint.status = EndpointStatus.Connected;

        // Room contains another endpount
        conference.endpoints[1].current_room.label = 'test-room';

        // Has permissions
        component.participantEndpoints.push({ id: endpoint.id } as AllowedEndpointResponse);

        expect(component.canCallEndpoint(endpoint)).toBeFalse();
    });

    it('should return can not call endpoint - not defense advocate', () => {
        // Not in current room
        component.roomLabel = 'test-room';
        const endpoint = conference.endpoints[0];
        endpoint.current_room.label = 'not-test-room';

        // Available
        endpoint.status = EndpointStatus.Connected;

        // Room contains another endpount
        conference.endpoints[1].current_room.label = 'not-test-room';

        expect(component.canCallEndpoint(endpoint)).toBeFalse();
    });

    it('should return participant status', () => {
        expect(component.trackParticipant(0, { status: ParticipantStatus.Available })).toBe(ParticipantStatus.Available);
    });

    describe('johGroups', () => {
        it('should return correct participants mapped to ParticipantListItem', () => {
            const testPanelMember1Data = { id: 'TestPanelMember1Id', name: 'TestPanelMember1Name' };
            const testPanelMember1 = new ParticipantResponse(testPanelMember1Data);
            const expectedPanelMember1: ParticipantListItem = { ...testPanelMember1Data };

            const testPanelMember2Data = { id: 'TestPanelMember2Id', name: 'TestPanelMember2Name' };
            const testPanelMember2 = new ParticipantResponse(testPanelMember2Data);
            const expectedPanelMember2: ParticipantListItem = { ...testPanelMember2Data };

            const testPanelMembers = [testPanelMember1, testPanelMember2];
            const expectedPanelMembers = [expectedPanelMember1, expectedPanelMember2];

            const testWinger1Data = { id: 'TestWinger1Id', name: 'TestWinger1Name' };
            const testWinger1 = new ParticipantResponse(testWinger1Data);
            const expectedWinger1: ParticipantListItem = { ...testWinger1Data };

            const testWinger2Data = { id: 'TestWinger2Id', name: 'TestWinger2Name' };
            const testWinger2 = new ParticipantResponse(testWinger2Data);
            const expectedWinger2: ParticipantListItem = { ...testWinger2Data };

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
        const litigantInPerson = new ParticipantResponse({
            id: 'litigantInPerson_id',
            status: ParticipantStatus.Available,
            display_name: 'litigantInPerson_display_name',
            role: Role.Individual,
            representee: 'litigantInPerson_representee',
            case_type_group: 'litigantInPerson_applicant',
            tiled_display_name: 'litigantInPerson_tiledDisplayName',
            hearing_role: HearingRole.LITIGANT_IN_PERSON,
            linked_participants: []
        });

        const witness1 = new ParticipantResponse({
            id: 'witness1_id',
            status: ParticipantStatus.Available,
            display_name: 'witness1_display_name',
            role: Role.Individual,
            representee: 'witness1_representee',
            case_type_group: 'witness1_applicant',
            tiled_display_name: 'witness1_tiledDisplayName',
            hearing_role: HearingRole.WITNESS,
            linked_participants: []
        });

        const witness2 = new ParticipantResponse({
            id: 'witness2_id',
            status: ParticipantStatus.Available,
            display_name: 'witness2_display_name',
            role: Role.Individual,
            representee: 'witness2_representee',
            case_type_group: 'witness2_applicant',
            tiled_display_name: 'witness2_tiledDisplayName',
            hearing_role: HearingRole.WITNESS,
            linked_participants: []
        });

        const regularObserver = new ParticipantResponse({
            id: 'regularObserver_id',
            status: ParticipantStatus.Available,
            display_name: 'regularObserver_display_name',
            role: Role.Individual,
            representee: 'regularObserver_representee',
            case_type_group: 'regularObserver_applicant',
            tiled_display_name: 'regularObserver_tiledDisplayName',
            hearing_role: HearingRole.OBSERVER,
            linked_participants: []
        });

        const quickLinkObserver1 = new ParticipantResponse({
            id: 'quickLinkObserver1_id',
            status: ParticipantStatus.Available,
            display_name: 'quickLinkObserver1_display_name',
            role: Role.QuickLinkObserver,
            representee: 'quickLinkObserver1_representee',
            case_type_group: 'quickLinkObserver1_applicant',
            tiled_display_name: 'quickLinkObserver1_tiledDisplayName',
            hearing_role: HearingRole.QUICK_LINK_OBSERVER,
            linked_participants: []
        });

        const quickLinkObserver2 = new ParticipantResponse({
            id: 'quickLinkObserver2_id',
            status: ParticipantStatus.Available,
            display_name: 'quickLinkObserver2_display_name',
            role: Role.QuickLinkObserver,
            representee: 'quickLinkObserver2_representee',
            case_type_group: 'quickLinkObserver2_applicant',
            tiled_display_name: 'quickLinkObserver2_tiledDisplayName',
            hearing_role: HearingRole.QUICK_LINK_OBSERVER,
            linked_participants: []
        });

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

            const observer1Index = result.findIndex(x => x.display_name === 'regularObserver_display_name');
            const qlObserver1Index = result.findIndex(x => x.display_name === 'quickLinkObserver1_display_name');
            const qlObserver2Index = result.findIndex(x => x.display_name === 'quickLinkObserver2_display_name');

            expect(observer1Index).toEqual(0);
            expect(qlObserver1Index).toEqual(1);
            expect(qlObserver2Index).toEqual(2);

            expect(result.length).toBe(testObservers.length);
        });
    });

    describe('getPrivateConsultationParticipants', () => {
        beforeEach(() => {
            conference.participants = new ConferenceTestData().getFullListOfNonJudgeParticipants();
            component.initParticipants();
        });

        it('should return list in correct order', () => {
            const privateConsultationParticipants = component.getPrivateConsultationParticipants();

            const applicant1Index = privateConsultationParticipants.findIndex(x => x.name === 'Mr B Smith');
            const applicant2Index = privateConsultationParticipants.findIndex(x => x.name === 'Mr A Smith');
            const applicant3Index = privateConsultationParticipants.findIndex(x => x.name === 'Mr G Smith');
            const respondent1Index = privateConsultationParticipants.findIndex(x => x.name === 'Mr E Smith');
            const respondent2Index = privateConsultationParticipants.findIndex(x => x.name === 'Mr F Smith');
            const respondent3Index = privateConsultationParticipants.findIndex(x => x.name === 'Mr H Smith');
            const quickLinkParticipant1Index = privateConsultationParticipants.findIndex(x => x.name === 'Mr C Smith');
            const quickLinkParticipant2Index = privateConsultationParticipants.findIndex(x => x.name === 'Mr D Smith');

            // Interpreters are filtered out
            expect(applicant2Index).toEqual(-1);
            expect(respondent3Index).toEqual(-1);

            expect(applicant1Index).toEqual(0);
            expect(applicant3Index).toEqual(1);
            expect(respondent1Index).toEqual(2);
            expect(respondent2Index).toEqual(3);
            expect(quickLinkParticipant1Index).toEqual(4);
            expect(quickLinkParticipant2Index).toEqual(5);
        });
    });

    describe('participantHasInviteRestrictions', () => {
        it('should return true if user is not judical, and participant is in not allowed to be invited', () => {
            // arrange
            component.loggedInUser = {
                role: Role.Individual
            } as LoggedParticipantResponse;
            const participant = {
                hearing_role: HearingRole.WITNESS
            } as ParticipantListItem;
            // act
            const result = component.participantHasInviteRestrictions(participant);
            // assert
            expect(result).toBeTrue();
        });

        it('should return false if user is not judical, and participant is allowed to be invited', () => {
            // arrange
            component.loggedInUser = {
                role: Role.Individual
            } as LoggedParticipantResponse;
            const participant = {
                hearing_role: HearingRole.APPELLANT
            } as ParticipantListItem;
            // act
            const result = component.participantHasInviteRestrictions(participant);
            // assert
            expect(result).toBeFalse();
        });

        it('should return false if user is judical', () => {
            // arrange
            // default for this test suit is judge
            const participant = {
                hearing_role: HearingRole.STAFF_MEMBER
            } as ParticipantListItem;
            // act
            const result = component.participantHasInviteRestrictions(participant);
            // assert
            expect(result).toBeFalse();
        });
    });
});
