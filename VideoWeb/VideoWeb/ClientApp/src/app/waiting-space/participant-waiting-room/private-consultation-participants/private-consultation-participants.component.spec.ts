import { ActivatedRoute } from '@angular/router';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    AllowedEndpointResponse,
    ConferenceResponse,
    ConsultationAnswer,
    EndpointStatus,
    LoggedParticipantResponse,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    RoomSummaryResponse
} from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConsultationRequestResponseMessage } from 'src/app/services/models/consultation-request-response-message';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { consultationServiceSpyFactory } from 'src/app/testing/mocks/mock-consultation.service';
import {
    eventsServiceSpy,
    consultationRequestResponseMessageSubjectMock,
    requestedConsultationMessageSubjectMock,
    participantStatusSubjectMock
} from 'src/app/testing/mocks/mock-events-service';
import { MockOidcSecurityService } from 'src/app/testing/mocks/mock-oidc-security.service';
import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';

import { PrivateConsultationParticipantsComponent } from './private-consultation-participants.component';
import { RequestedConsultationMessage } from 'src/app/services/models/requested-consultation-message';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { HearingRole } from '../../models/hearing-role-model';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';

describe('PrivateConsultationParticipantsComponent', () => {
    let component: PrivateConsultationParticipantsComponent;
    let conference: ConferenceResponse;
    const mockOidcSecurityService = new MockOidcSecurityService();
    const eventsService = eventsServiceSpy;
    let oidcSecurityService;
    let consultationService: jasmine.SpyObj<ConsultationService>;
    let logger: jasmine.SpyObj<Logger>;
    let videoWebService: jasmine.SpyObj<VideoWebService>;

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

    it('should get participant-row classes', () => {
        component.roomLabel = 'test-room';
        const p = conference.participants[0];
        p.current_room.label = 'test-room';
        expect(component.getParticipantRowClasses(p)).toEqual('participant-row');
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

    it('should get same room status', () => {
        component.roomLabel = 'test-room';
        const p = conference.participants[0];
        p.current_room.label = 'test-room';
        expect(component.getParticipantStatus(p)).toEqual('');
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
            new ConsultationRequestResponseMessage(conference.id, 'Room1', 'Participant1', ConsultationAnswer.Rejected)
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
            new ConsultationRequestResponseMessage('IncorrectConferenceId', 'Room1', 'Participant1', ConsultationAnswer.Rejected)
        );

        // Assert
        expect(component.participantCallStatuses['Participant1']).toBeUndefined();
    });

    it('should set answer on response message then reset after timeout', fakeAsync(() => {
        component.roomLabel = 'Room1';
        consultationRequestResponseMessageSubjectMock.next(
            new ConsultationRequestResponseMessage(conference.id, 'Room1', 'Participant1', ConsultationAnswer.Rejected)
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
            new ConsultationRequestResponseMessage(conference.id, 'Room1', 'Participant1', ConsultationAnswer.Rejected)
        );
        flushMicrotasks();
        tick(2000);
        requestedConsultationMessageSubjectMock.next(
            new RequestedConsultationMessage(conference.id, 'Room1', 'Participant2', 'Participant1')
        );
        tick(9000);

        // Assert
        expect(component.participantCallStatuses['Participant1']).toBe('Calling');
    }));

    it('should not set calling if different room', () => {
        component.roomLabel = 'Room1';
        requestedConsultationMessageSubjectMock.next(
            new RequestedConsultationMessage(conference.id, 'Room2', 'Participant2', 'Participant1')
        );

        // Assert
        expect(component.participantCallStatuses['Participant1']).toBeUndefined();
    });

    it('should not set calling if different conference', () => {
        component.roomLabel = 'Room1';
        requestedConsultationMessageSubjectMock.next(
            new RequestedConsultationMessage('IncorrectConferenceId', 'Room1', 'Participant2', 'Participant1')
        );

        // Assert
        expect(component.participantCallStatuses['Participant1']).toBeUndefined();
    });

    it('should reset participant call status on status message', () => {
        component.roomLabel = 'Room1';
        requestedConsultationMessageSubjectMock.next(
            new RequestedConsultationMessage(conference.id, 'Room1', 'Participant2', 'Participant1')
        );
        participantStatusSubjectMock.next(
            new ParticipantStatusMessage('Participant1', 'Username', conference.id, ParticipantStatus.Disconnected)
        );

        // Assert
        expect(component.participantCallStatuses['Participant1']).toBeNull();
    });

    it('should get participant status in current room', () => {
        component.roomLabel = 'Room1';
        const participant = new ParticipantResponse({
            current_room: {
                label: 'Room1'
            } as RoomSummaryResponse
        });

        const result = component.getParticipantStatus(participant);

        // Assert
        expect(result).toBe('');
    });

    it('should get status from participant', () => {
        component.roomLabel = 'Room1';
        const statuses = [
            ['Calling', 'private-consultation-participants.calling'],
            ['Transferring', 'private-consultation-participants.transferring'],
            ['Accepted', 'private-consultation-participants.transferring'],
            ['Rejected', 'private-consultation-participants.declined'],
            ['Failed', 'private-consultation-participants.failed'],
            ['None', 'private-consultation-participants.no-answer']
        ];
        statuses.forEach(([status, resultText]) => {
            const participant = new ParticipantResponse({
                id: 'Participant1'
            });
            component.participantCallStatuses['Participant1'] = status;

            translateService.instant.calls.reset();
            const result = component.getParticipantStatus(participant);

            // Assert
            expect(result).toBe(resultText);
        });
    });

    it('should get participant status Other Room', () => {
        component.roomLabel = 'Room1';
        const participant = new ParticipantResponse({
            current_room: {
                label: 'ParticipantConsultationRoom10'
            } as RoomSummaryResponse,
            id: 'Participant1'
        });

        const result = component.getParticipantStatus(participant);

        // Assert
        expect(result).toBe('ParticipantConsultationRoom10');
        expect(consultationService.consultationNameToString).toHaveBeenCalledWith('ParticipantConsultationRoom10', true);
    });

    it('should get participant status Judge Room', () => {
        component.roomLabel = 'Room1';
        const participant = new ParticipantResponse({
            current_room: {
                label: 'JudgeJOHConsultationRoom10'
            } as RoomSummaryResponse,
            id: 'Participant1'
        });

        const result = component.getParticipantStatus(participant);

        // Assert
        expect(result).toBe('JudgeJOHConsultationRoom10');
        expect(consultationService.consultationNameToString).toHaveBeenCalledWith('JudgeJOHConsultationRoom10', true);
    });

    it('should get participant status disconnected', () => {
        component.roomLabel = 'Room1';
        const participant = new ParticipantResponse({
            id: 'Participant1',
            status: ParticipantStatus.Disconnected
        });

        translateService.instant.calls.reset();
        const expectedText = 'private-consultation-participants.not-available';
        const result = component.getParticipantStatus(participant);

        // Assert
        expect(result).toBe(expectedText);
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

    it('should get status class from participant', () => {
        component.roomLabel = 'Room1';
        const statuses = [
            ['Calling', 'yellow'],
            ['Transferring', 'yellow'],
            ['Accepted', 'yellow'],
            ['Rejected', 'red'],
            ['Failed', 'red'],
            ['None', 'red']
        ];
        statuses.forEach(([status, resultClass]) => {
            const participant = new ParticipantResponse({
                id: 'Participant1'
            });
            component.participantCallStatuses['Participant1'] = status;

            const result = component.getParticipantStatusClasses(participant);

            // Assert
            expect(result).toBe(resultClass);
        });
    });

    it('should get status class Other Room', () => {
        component.roomLabel = 'Room1';
        const participant = new ParticipantResponse({
            current_room: {
                label: 'ParticipantConsultationRoom10'
            } as RoomSummaryResponse,
            id: 'Participant1',
            status: ParticipantStatus.InConsultation
        });

        const result = component.getParticipantStatusClasses(participant);

        // Assert
        expect(result).toBe('outline');
    });

    it('should get status same room default', () => {
        component.roomLabel = 'Room1';
        const participant = new ParticipantResponse({
            current_room: {
                label: 'Room1'
            } as RoomSummaryResponse,
            id: 'Participant1',
            status: ParticipantStatus.InConsultation
        });

        const result = component.getParticipantStatusClasses(participant);

        // Assert
        expect(result).toBe('white');
    });

    it('should get status same not inconsultation', () => {
        component.roomLabel = 'Room1';
        const participant = new ParticipantResponse({
            id: 'Participant1',
            status: ParticipantStatus.Available
        });

        const result = component.getParticipantStatusClasses(participant);

        // Assert
        expect(result).toBe('white');
    });

    it('should get participants to a joh consultation room', () => {
        const participants = new ConferenceTestData().getListOfParticipants();
        const judge = participants[0];
        judge.hearing_role = HearingRole.JUDGE;
        const panelMember = participants[1];
        panelMember.hearing_role = HearingRole.PANEL_MEMBER;
        const representative = participants[2];
        representative.hearing_role = HearingRole.REPRESENTATIVE;
        component.roomLabel = 'judgejohconsultationroom';
        component.participantsInConsultation = [judge, panelMember, representative];
        expect(component.getPrivateConsultationParticipants().length).toBe(3);
    });

    it('should get participants to a private consultation room', () => {
        const participants = new ConferenceTestData().getListOfParticipants();
        const judge = participants[0];
        judge.hearing_role = HearingRole.JUDGE;
        const panelMember = participants[1];
        panelMember.hearing_role = HearingRole.PANEL_MEMBER;
        const representative = participants[2];
        representative.hearing_role = HearingRole.REPRESENTATIVE;
        const representativeNo2 = participants[3];
        representativeNo2.hearing_role = HearingRole.REPRESENTATIVE;
        component.roomLabel = 'privateconsultationroom';
        component.participantsInConsultation = [judge, panelMember, representative,representativeNo2];
        expect(component.getPrivateConsultationParticipants().length).toBe(2);
    });

    it('should not get witnesses', () => {
        const participants = new ConferenceTestData().getListOfParticipants();
        const witness = participants[0];
        witness.hearing_role = HearingRole.WITNESS;
        const representative = participants[1];
        component.participantsInConsultation = [witness, representative];
        expect(component.getPrivateConsultationParticipants().length).toBe(1);
    });

    it('should not get observers', () => {
        const participants = new ConferenceTestData().getListOfParticipants();
        const observer = participants[0];
        observer.hearing_role = HearingRole.OBSERVER;
        const representative = participants[1];
        component.participantsInConsultation = [observer, representative];
        expect(component.getPrivateConsultationParticipants().length).toBe(1);
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
});
