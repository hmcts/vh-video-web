import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    LoggedParticipantResponse,
    ParticipantStatus,
    Role,
    RoomSummaryResponse
} from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { globalConference, globalParticipant } from '../../waiting-room-shared/tests/waiting-room-base-setup';

import { JoinPrivateConsultationComponent } from './join-private-consultation.component';

describe('JoinPrivateConsultationComponent', () => {
    let component: JoinPrivateConsultationComponent;
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

        component = new JoinPrivateConsultationComponent(logger);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set selected room', () => {
        component.setSelectedRoom('room-label');
        expect(component.selectedRoomLabel).toEqual('room-label');
    });

    it('should return distinct rooms', () => {
        globalConference.participants[0].current_room = new RoomSummaryResponse({ label: 'ConferenceRoom1' });
        globalConference.participants[1].current_room = new RoomSummaryResponse({ label: 'ConferenceRoom1' });
        globalConference.participants[2].current_room = new RoomSummaryResponse({ label: 'ConferenceRoom1' });

        component.participants = globalConference.participants;
        expect(component.getRoomDetails()).toHaveSize(1);
    });
});
