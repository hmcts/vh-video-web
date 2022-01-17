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
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { consultationServiceSpyFactory } from 'src/app/testing/mocks/mock-consultation.service';
import {
    consultationRequestResponseMessageSubjectMock,
    eventsServiceSpy,
    participantStatusSubjectMock,
    requestedConsultationMessageSubjectMock
} from 'src/app/testing/mocks/mock-events-service';
import { MockOidcSecurityService } from 'src/app/testing/mocks/mock-oidc-security.service';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { HearingRole } from '../../models/hearing-role-model';
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

    it('should not get witnesses', () => {
        const participants = new ConferenceTestData().getListOfParticipants();
        const witness = participants[0];
        witness.hearing_role = HearingRole.WITNESS;
        const representative = participants[1];
        component.nonJudgeParticipants = [witness, representative];
        expect(component.getPrivateConsultationParticipants().length).toBe(1);
    });

    it('should sort quick link participants', () => {
        const testData = new ConferenceTestData();
        component.nonJudgeParticipants = [testData.quickLinkParticipant2, testData.quickLinkParticipant1];
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

    it('should return can not call endpoint - room already has endpoint', () => {
        // Not in current room
        component.roomLabel = 'test-room';
        const endpoint = conference.endpoints[0];
        endpoint.current_room.label = 'not-test-room';

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

    // TODO johGroups tests

    describe('getWitnessesAndObservers', () => {
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
            component.nonJudgeParticipants = testParticipants;
            component.observers = testObservers;
        });

        it('should return nothing if is not joh consultation', () => {
            spyOn(component, 'isJohConsultation').and.returnValue(false);
            const result = component.getWitnessesAndObservers();
            expect(result).toEqual([]);
        });

        it('should return list in correct order for joh consultation', () => {
            const mappedWitness1: ParticipantListItem = { ...witness1 };
            const mappedWitness2: ParticipantListItem = { ...witness2 };
            const mappedRegularObserver: ParticipantListItem = { ...regularObserver };
            const mappedQuickLinkObserver1: ParticipantListItem = { ...quickLinkObserver1 };
            const mappedQuickLinkObserver2: ParticipantListItem = { ...quickLinkObserver2 };

            spyOn(component, 'isJohConsultation').and.returnValue(true);
            const result = component.getWitnessesAndObservers();
            const witnessesOrdered = [mappedWitness1, mappedWitness2].sort((a, b) => a.display_name.localeCompare(b.display_name));

            const observersOrdered = [mappedRegularObserver, mappedQuickLinkObserver1, mappedQuickLinkObserver2].sort((a, b) =>
                a.display_name.localeCompare(b.display_name)
            );

            expect(result.length).toBe(witnessesOrdered.length + observersOrdered.length);
            expect(result.slice(0, witnessesOrdered.length)).toEqual(witnessesOrdered);
            expect(result.slice(witnessesOrdered.length)).toEqual(observersOrdered);
        });
    });
});
