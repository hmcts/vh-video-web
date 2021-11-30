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
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { MockOidcSecurityService } from 'src/app/testing/mocks/mock-oidc-security.service';
import { ParticipantItemComponent } from './participant-item.component';

describe('ParticipantItemComponent', () => {
    let component: ParticipantItemComponent;
    let conference: ConferenceResponse;
    const mockOidcSecurityService = new MockOidcSecurityService();
    const eventsService = eventsServiceSpy;
    let oidcSecurityService;
    let logger: jasmine.SpyObj<Logger>;
    let videoWebService: jasmine.SpyObj<VideoWebService>;

    let logged: LoggedParticipantResponse;
    let activatedRoute: ActivatedRoute;

    beforeAll(() => {
        oidcSecurityService = mockOidcSecurityService;

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
        activatedRoute = <any>{
            snapshot: { data: { loggedUser: logged } }
        };
        component = new ParticipantItemComponent();

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
});
