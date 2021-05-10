import { ActivatedRoute } from '@angular/router';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    EndpointStatus,
    LoggedParticipantResponse,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    RoomSummaryResponse
} from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { consultationServiceSpyFactory } from 'src/app/testing/mocks/mock-consultation.service';
import {
    eventsServiceSpy,
} from 'src/app/testing/mocks/mock-events-service';
import { MockOidcSecurityService } from 'src/app/testing/mocks/mock-oidc-security.service';
import { JohParticipantItemComponent } from './joh-participant-item.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';

fdescribe('JohParticipantItemComponent', () => {
    let component: JohParticipantItemComponent;
    // let component: PrivateConsultationParticipantsComponent;
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
        component = new JohParticipantItemComponent(translateService, consultationService);

        component.conferenceId = conference.id;

        eventsService.getConsultationRequestResponseMessage.calls.reset();
        eventsService.getRequestedConsultationMessage.calls.reset();
        eventsService.getParticipantStatusMessage.calls.reset();
        eventsService.getParticipantStatusMessage.calls.reset();
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
});
