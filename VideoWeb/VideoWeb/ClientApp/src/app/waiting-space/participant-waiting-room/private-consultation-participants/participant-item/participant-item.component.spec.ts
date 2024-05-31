import { ActivatedRoute } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    EndpointStatus,
    LinkedParticipantResponse,
    LinkType,
    LoggedParticipantResponse,
    ParticipantResponseVho,
    ParticipantStatus,
    Role
} from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { MockOidcSecurityService } from 'src/app/testing/mocks/mock-oidc-security.service';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
import { ParticipantItemComponent } from './participant-item.component';
import {
    mapEndpointToVHEndpoint,
    mapParticipantToVHParticipant
} from 'src/app/waiting-space/store/models/api-contract-to-state-model-mappers';
import { VHParticipant } from 'src/app/waiting-space/store/models/vh-conference';

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
        const p = mapParticipantToVHParticipant(conference.participants[0]);
        p.status = ParticipantStatus.Available;
        expect(component.isParticipantAvailable(p)).toEqual(true);
    });

    it('should return endpoint available', () => {
        const p = mapEndpointToVHEndpoint(conference.endpoints[0]);
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
            const participant = jasmine.createSpyObj<VHParticipant>('VHParticipant', [], {
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
        const participant = jasmine.createSpyObj<VHParticipant>('VHParticipant', [], {
            id: 'Participant1',
            room: { label: 'Room1', locked: false }
        });

        const result = component.isParticipantInCurrentRoom(participant);

        // Assert
        expect(result).toBeTrue();
    });

    it('should get participant in current different room', () => {
        component.roomLabel = 'Room1';
        const participant = jasmine.createSpyObj<VHParticipant>('VHParticipant', [], {
            id: 'Participant1',
            room: { label: 'Room2', locked: false }
        });

        const result = component.isParticipantInCurrentRoom(participant);

        // Assert
        expect(result).toBeFalse();
    });

    it('should get yellow row classes', () => {
        const roomLabel = 'test-room';
        component.roomLabel = roomLabel;
        const p = jasmine.createSpyObj<VHParticipant>('VHParticipant', [], { room: { label: roomLabel, locked: false } });
        expect(component.getRowClasses(p)).toEqual('yellow');
    });

    it('should get row classes', () => {
        const roomLabel = 'test-room';
        component.roomLabel = roomLabel;

        const p = jasmine.createSpyObj<VHParticipant>('VHParticipant', [], { room: { label: 'test-room-two', locked: false } });
        expect(component.getRowClasses(p)).toEqual('');
    });

    describe('isInterpreterAvailable', () => {
        it('should return true when no interpreter is linked', () => {
            component.interpreter = null;
            const result = component.isInterpreterAvailable();
            expect(result).toBeTrue();
        });

        it('should return true when interpreter is linked and available', () => {
            const linkedParticipants: LinkedParticipantResponse[] = [];

            const linkedParticipant = new LinkedParticipantResponse({
                link_type: LinkType.Interpreter,
                linked_id: '9b115922-47cb-4f60-94b1-fccd714f94fa'
            });

            linkedParticipants.push(linkedParticipant);

            const interpreter = new ParticipantResponseVho({
                id: 'ff685c8a-6170-464f-ad2c-59362ff40e22',
                name: 'B Smith',
                status: ParticipantStatus.Available,
                role: Role.Individual,
                display_name: 'B Smith Interpreter',
                case_type_group: 'Applicant',
                tiled_display_name: 'CIVILIAN;NO_HEARTBEAT;B Smith Interpreter;ff685c8a-6170-464f-ad2c-59362ff40e22',
                hearing_role: HearingRole.INTERPRETER,
                current_room: undefined,
                linked_participants: linkedParticipants
            });

            component.interpreter = mapParticipantToVHParticipant(interpreter);

            const result = component.isInterpreterAvailable();
            expect(result).toBeTrue();
        });

        it('should return false when interpreter is linked and not available', () => {
            const linkedParticipants: LinkedParticipantResponse[] = [];

            const participant3LinkedParticipants1 = new LinkedParticipantResponse({
                link_type: LinkType.Interpreter,
                linked_id: '9b115922-47cb-4f60-94b1-fccd714f94fa'
            });

            linkedParticipants.push(participant3LinkedParticipants1);

            const participant3 = new ParticipantResponseVho({
                id: 'ff685c8a-6170-464f-ad2c-59362ff40e22',
                name: 'B Smith',
                status: ParticipantStatus.Disconnected,
                role: Role.Individual,
                display_name: 'B Smith Interpreter',
                case_type_group: 'Applicant',
                tiled_display_name: 'CIVILIAN;NO_HEARTBEAT;B Smith Interpreter;ff685c8a-6170-464f-ad2c-59362ff40e22',
                hearing_role: HearingRole.INTERPRETER,
                current_room: undefined,
                linked_participants: linkedParticipants
            });

            component.interpreter = mapParticipantToVHParticipant(participant3);

            const result = component.isInterpreterAvailable();
            expect(result).toBeFalse();
        });
    });
});
