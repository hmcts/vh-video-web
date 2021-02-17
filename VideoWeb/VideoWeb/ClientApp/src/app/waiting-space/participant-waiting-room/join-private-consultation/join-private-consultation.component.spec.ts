import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    LoggedParticipantResponse,
    ParticipantResponseVho,
    ParticipantStatus,
    Role
} from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { consultationServiceSpyFactory } from 'src/app/testing/mocks/mock-consultation-service';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';

import { JoinPrivateConsultationComponent } from './join-private-consultation.component';

describe('PrivateConsultationParticipantsComponent', () => {
    let component: JoinPrivateConsultationComponent;

    let conference: ConferenceResponse;
    let participantsObserverPanelMember: ParticipantResponseVho[];
    let participantsWinger: ParticipantResponseVho[];
    let participantsWitness: ParticipantResponseVho[];

    const mockAdalService = new MockAdalService();
    let adalService;
    let consultationService: jasmine.SpyObj<ConsultationService>;

    let logger: jasmine.SpyObj<Logger>;
    let videoWebService: jasmine.SpyObj<VideoWebService>;

    const testdata = new ConferenceTestData();
    let logged: LoggedParticipantResponse;

    beforeAll(() => {
        adalService = mockAdalService;

        consultationService = consultationServiceSpyFactory();

        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getObfuscatedName']);
        videoWebService.getObfuscatedName.and.returnValue('t***** u*****');

        logger = jasmine.createSpyObj<Logger>('Logger', ['debug', 'info', 'warn', 'event', 'error']);
        participantsObserverPanelMember = testdata.getListOfParticipantsObserverAndPanelMembers();
        participantsWinger = testdata.getListOfParticipantsWingers();
        participantsWitness = testdata.getListOfParticipantsWitness();
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
});
