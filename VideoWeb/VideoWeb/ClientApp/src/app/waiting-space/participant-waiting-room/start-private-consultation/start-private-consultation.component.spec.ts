import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    EndpointStatus,
    LoggedParticipantResponse,
    ParticipantStatus,
    Role,
    RoomSummaryResponse
} from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { StartPrivateConsultationComponent } from './start-private-consultation.component';

describe('StartPrivateConsultationComponent', () => {
    let component: StartPrivateConsultationComponent;
    let conference: ConferenceResponse;
    let logger: jasmine.SpyObj<Logger>;
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    let logged: LoggedParticipantResponse;

    beforeAll(() => {
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

        component = new StartPrivateConsultationComponent(logger);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return participant selected', () => {
        component.selectedParticipants.push('guid');
        expect(component.participantSelected('guid')).toBeTruthy();
    });

    it('should return endpoint selected', () => {
        component.selectedEndpoints.push('guid');
        expect(component.endpointSelected('guid')).toBeTruthy();
    });

    it('should not return participant selected', () => {
        component.selectedParticipants.push('guid');
        component.toggleParticipant('guid');
        expect(component.selectedParticipants.indexOf('guid')).toEqual(-1);
    });

    it('should return participant selected', () => {
        component.selectedParticipants = new Array<string>();
        component.toggleParticipant('guid');
        expect(component.selectedParticipants.indexOf('guid')).toEqual(0);
    });

    it('should not return endpoint selected', () => {
        component.selectedEndpoints.push('guid');
        component.toggleEndpoint('guid');
        expect(component.selectedEndpoints.indexOf('guid')).toEqual(-1);
    });

    it('should return endpoint selected', () => {
        component.selectedEndpoints = new Array<string>();
        component.toggleEndpoint('guid');
        expect(component.selectedEndpoints.indexOf('guid')).toEqual(0);
    });

    it('should return endpoint selected but unselect others', () => {
        component.selectedEndpoints.push('guid2');
        component.toggleEndpoint('guid');
        expect(component.selectedEndpoints.indexOf('guid')).toEqual(0);
        expect(component.selectedEndpoints.indexOf('guid2')).toEqual(-1);
    });

    it('should return participant hearing role text', () => {
        expect(component.participantHearingRoleText(conference.participants[0])).toEqual('Litigant in person');
    });

    it('should return participant representee hearing role text', () => {
        const representive = 'Representative';
        const representee = 'representee';
        const participant = conference.participants[0];
        participant.representee = representee;
        participant.hearing_role = representive;
        expect(component.participantHearingRoleText(participant)).toEqual(`${representive} for ${representee}`);
    });

    it('should return unavailable status class for disconnected', () => {
        const participant = conference.participants[0];
        participant.status = ParticipantStatus.Disconnected;
        expect(component.getParticipantStatusCss(participant)).toEqual('unavailable');
    });

    it('should return unavailable status class for in hearing', () => {
        const participant = conference.participants[0];
        participant.status = ParticipantStatus.InHearing;
        expect(component.getParticipantStatusCss(participant)).toEqual('unavailable');
    });

    it('should return in-consultation status class', () => {
        const participant = conference.participants[0];
        participant.status = ParticipantStatus.InConsultation;
        expect(component.getParticipantStatusCss(participant)).toEqual('in-consultation');
    });

    it('should return unavailable status class for disconnected endpoint', () => {
        const endpoint = conference.endpoints[0];
        endpoint.status = EndpointStatus.Disconnected;
        expect(component.getEndpointStatusCss(endpoint)).toEqual('unavailable');
    });

    it('should return unavailable status class for in not yet joined endpoint', () => {
        const endpoint = conference.endpoints[0];
        endpoint.status = EndpointStatus.NotYetJoined;
        expect(component.getEndpointStatusCss(endpoint)).toEqual('unavailable');
    });

    it('should return in-consultation status class endpoint', () => {
        const endpoint = conference.endpoints[0];
        endpoint.status = EndpointStatus.InConsultation;
        expect(component.getEndpointStatusCss(endpoint)).toEqual('in-consultation');
    });

    it('should return true from should display label', () => {
        const participant = conference.participants[0];
        participant.status = ParticipantStatus.InConsultation;
        expect(component.getShouldDisplayLabel(participant)).toBeTruthy();
    });

    it('should return false from should display label', () => {
        const participant = conference.participants[0];
        participant.status = ParticipantStatus.Disconnected;
        expect(component.getShouldDisplayLabel(participant)).toBeTruthy();
    });

    it('should return unavailable participant status', () => {
        const participant = conference.participants[0];
        participant.status = ParticipantStatus.Disconnected;
        expect(component.getParticipantStatus(participant)).toEqual('Unavailable');
    });

    it('should return in consultaion participant status', () => {
        const participant = conference.participants[0];
        participant.status = ParticipantStatus.InConsultation;
        participant.current_room = new RoomSummaryResponse({ label: 'ParticipantConsultationRoom1' });
        expect(component.getParticipantStatus(participant)).toContain('In meeting room 1');
    });

    it('should return in judge consultaion participant status', () => {
        const participant = conference.participants[0];
        participant.status = ParticipantStatus.InConsultation;
        participant.current_room = new RoomSummaryResponse({ label: 'JudgeJOHConsultationRoom1' });
        expect(component.getParticipantStatus(participant)).toContain('In judge room 1');
    });

    it('should return unavailable endpoint status', () => {
        const endpoint = conference.endpoints[0];
        endpoint.status = EndpointStatus.Disconnected;
        expect(component.getEndpointStatus(endpoint)).toEqual('Unavailable');
    });

    it('should return in consultaion endpoint status', () => {
        const endpoint = conference.endpoints[0];
        endpoint.status = EndpointStatus.InConsultation;
        endpoint.current_room = new RoomSummaryResponse({ label: 'ParticipantConsultationRoom1' });
        expect(component.getEndpointStatus(endpoint)).toContain('In meeting room 1');
    });
});
