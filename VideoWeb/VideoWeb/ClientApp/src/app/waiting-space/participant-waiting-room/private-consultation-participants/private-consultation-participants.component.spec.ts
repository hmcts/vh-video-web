import { ActivatedRoute } from '@angular/router';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    ConsultationAnswer,
    LoggedParticipantResponse,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    RoomSummaryResponse
} from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConsultationRequestResponseMessage } from 'src/app/services/models/consultation-request-response-message';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { consultationServiceSpyFactory } from 'src/app/testing/mocks/mock-consultation-service';
import { eventsServiceSpy, consultationRequestResponseMessageSubjectMock, requestedConsultationMessageSubjectMock, participantStatusSubjectMock } from 'src/app/testing/mocks/mock-events-service';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';

import { PrivateConsultationParticipantsComponent } from './private-consultation-participants.component';
import { RequestedConsultationMessage } from 'src/app/services/models/requested-consultation-message';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';

describe('PrivateConsultationParticipantsComponent', () => {
    let component: PrivateConsultationParticipantsComponent;
    let conference: ConferenceResponse;
    const mockAdalService = new MockAdalService();
    const eventsService = eventsServiceSpy;
    let adalService;
    let consultationService: jasmine.SpyObj<ConsultationService>;
    let logger: jasmine.SpyObj<Logger>;
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    
    let logged: LoggedParticipantResponse;

    beforeAll(() => {
        adalService = mockAdalService;

        consultationService = consultationServiceSpyFactory();

        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getObfuscatedName']);
        videoWebService.getObfuscatedName.and.returnValue('t***** u*****');

        logger = jasmine.createSpyObj<Logger>('Logger', ['debug', 'info', 'warn', 'event', 'error']);
    });

    beforeEach(() => {
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

        component = new PrivateConsultationParticipantsComponent(adalService, consultationService, eventsService, logger, videoWebService);

        component.conference = conference;

        component.loggedInUser = logged;
        component.ngOnInit();

        eventsService.getConsultationRequestResponseMessage.calls.reset();
        eventsService.getRequestedConsultationMessage.calls.reset();
        eventsService.getParticipantStatusMessage.calls.reset();
        eventsService.getParticipantStatusMessage.calls.reset();
    });

    afterEach(() => {
        component.eventHubSubscriptions$.unsubscribe();
    })

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return participant available', () => {
        const p = conference.participants[0];
        p.status = ParticipantStatus.Available;
        expect(component.participantAvailable(p)).toEqual(true);
    });

    it('should get row classes', () => {
        component.roomLabel = 'test-room';
        const p = conference.participants[0];
        p.current_room.label = 'test-room-two';
        expect(component.getRowClasses(p)).toEqual('');
    });

    it('should get yellow row classes', () => {
        component.roomLabel = 'test-room';
        const p = conference.participants[0];
        p.current_room.label = 'test-room';
        expect(component.getRowClasses(p)).toEqual('yellow');
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
        consultationRequestResponseMessageSubjectMock.next(new ConsultationRequestResponseMessage(conference.id, 'Room1', 'Participant1', ConsultationAnswer.Rejected));

        // Assert
        expect(component.participantCallStatuses['Participant1']).toBe('Rejected');
    });
    
    it('should not set set answer if different room', () => {
        component.roomLabel = 'Room1';
        consultationRequestResponseMessageSubjectMock.next(new ConsultationRequestResponseMessage(conference.id, 'Room2', 'Participant1', ConsultationAnswer.Rejected));

        // Assert
        expect(component.participantCallStatuses['Participant1']).toBeUndefined();
    });
    
    it('should not set set answer if different conference', () => {
        component.roomLabel = 'Room1';
        consultationRequestResponseMessageSubjectMock.next(new ConsultationRequestResponseMessage('IncorrectConferenceId', 'Room1', 'Participant1', ConsultationAnswer.Rejected));

        // Assert
        expect(component.participantCallStatuses['Participant1']).toBeUndefined();
    });

    it('should set answer on response message then reset after timeout', fakeAsync(() => {
        component.roomLabel = 'Room1';
        consultationRequestResponseMessageSubjectMock.next(new ConsultationRequestResponseMessage(conference.id, 'Room1', 'Participant1', ConsultationAnswer.Rejected));
        flushMicrotasks();

        // Assert
        expect(component.participantCallStatuses['Participant1']).toBe('Rejected')
        tick(10000);
        expect(component.participantCallStatuses['Participant1']).toBeNull();
    }));
    
    it('should a 2nd call after answering should prevent timeout call', fakeAsync(() => {
        component.roomLabel = 'Room1';
        consultationRequestResponseMessageSubjectMock.next(new ConsultationRequestResponseMessage(conference.id, 'Room1', 'Participant1', ConsultationAnswer.Rejected));
        flushMicrotasks();
        tick(2000);
        requestedConsultationMessageSubjectMock.next(new RequestedConsultationMessage(conference.id, 'Room1', 'Participant2', 'Participant1'));
        tick(9000);

        // Assert
        expect(component.participantCallStatuses['Participant1']).toBe('Calling');
    }));
    
    it('should not set set calling if different room', () => {
        component.roomLabel = 'Room1';
        requestedConsultationMessageSubjectMock.next(new RequestedConsultationMessage(conference.id, 'Room2', 'Participant2', 'Participant1'));

        // Assert
        expect(component.participantCallStatuses['Participant1']).toBeUndefined();
    });
    
    it('should not set set calling if different conference', () => {
        component.roomLabel = 'Room1';
        requestedConsultationMessageSubjectMock.next(new RequestedConsultationMessage('IncorrectConferenceId', 'Room1', 'Participant2', 'Participant1'));

        // Assert
        expect(component.participantCallStatuses['Participant1']).toBeUndefined();
    });
    
    it('should reset participant call status on status message', () => {
        component.roomLabel = 'Room1';
        requestedConsultationMessageSubjectMock.next(new RequestedConsultationMessage(conference.id, 'Room1', 'Participant2', 'Participant1'));
        participantStatusSubjectMock.next(new ParticipantStatusMessage("Participant1", "Username", conference.id, ParticipantStatus.Disconnected));

        // Assert
        expect(component.participantCallStatuses['Participant1']).toBeNull();
    });
    
    it('should get participant status in current room', () => {
        component.roomLabel = 'Room1';
        var participant = new ParticipantResponse({
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
            ['Calling', 'Calling...'],
            ['Rejected', 'Declined'],
            ['Failed', 'Failed'],
            ['None', 'No Answer']
        ];
        statuses.forEach(([status, resultClass]) => {
            var participant = new ParticipantResponse({
                id: 'Participant1'
            });
            component.participantCallStatuses['Participant1'] = status;

            const result = component.getParticipantStatus(participant);

            // Assert
            expect(result).toBe(resultClass);
        });
    });
    
    it('should get participant status Other Room', () => {
        component.roomLabel = 'Room1';
        var participant = new ParticipantResponse({
            current_room: {
                label: 'ParticipantConsultationRoom10'
            } as RoomSummaryResponse,
            id: 'Participant1'
        });

        const result = component.getParticipantStatus(participant);

        // Assert
        expect(result).toBe('Room 10');
    });
    
    it('should get participant status disconnected', () => {
        component.roomLabel = 'Room1';
        var participant = new ParticipantResponse({
            id: 'Participant1',
            status: ParticipantStatus.Disconnected
        });

        const result = component.getParticipantStatus(participant);

        // Assert
        expect(result).toBe('Not available');
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
            var participant = new ParticipantResponse({
                id: 'Participant1',
                status: status as ParticipantStatus
            });

            const result = component.participantAvailable(participant);

            // Assert
            expect(result).toBe(available as boolean);
        });
    });
    
    it('should get participant in current room', () => {
        component.roomLabel = 'Room1';
        var participant = new ParticipantResponse({
            id: 'Participant1',
            current_room: {
                label: 'Room1'
            } as RoomSummaryResponse,
        });

        const result = component.participantIsInCurrentRoom(participant);

        // Assert
        expect(result).toBeTrue();
    });
    
    it('should get participant in current different room', () => {
        component.roomLabel = 'Room1';
        var participant = new ParticipantResponse({
            id: 'Participant1',
            current_room: {
                label: 'Room2'
            } as RoomSummaryResponse,
        });

        const result = component.participantIsInCurrentRoom(participant);

        // Assert
        expect(result).toBeFalse();
    });

    it('should get status class from participant', () => {
        component.roomLabel = 'Room1';
        const statuses = [
            ['Calling', 'yellow'],
            ['Rejected', 'red'],
            ['Failed', 'red'],
            ['None', 'red']
        ];
        statuses.forEach(([status, resultClass]) => {
            var participant = new ParticipantResponse({
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
        var participant = new ParticipantResponse({
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
        var participant = new ParticipantResponse({
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
        var participant = new ParticipantResponse({
            id: 'Participant1',
            status: ParticipantStatus.Available
        });

        const result = component.getParticipantStatusClasses(participant);

        // Assert
        expect(result).toBe('white');
    });
});
