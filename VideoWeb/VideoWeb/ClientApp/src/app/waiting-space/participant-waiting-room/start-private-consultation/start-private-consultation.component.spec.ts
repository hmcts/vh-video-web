import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse, LoggedParticipantResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { globalParticipant } from '../../waiting-room-shared/tests/waiting-room-base-setup';
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

    it('should not return participant selected', () => {
        component.selectedParticipants.push('guid');
        component.toggleParticipant('guid');
        expect(component.selectedParticipants.indexOf('guid')).toEqual(-1);
    });

    it('should not return participant selected', () => {
        component.selectedParticipants = new Array<string>();
        component.toggleParticipant('guid');
        expect(component.selectedParticipants.indexOf('guid')).toEqual(0);
    });

    it('should return participant hearing role text', () => {
        expect(component.participantHearingRoleText(conference.participants[0])).toEqual('Litigant in person');
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
});
