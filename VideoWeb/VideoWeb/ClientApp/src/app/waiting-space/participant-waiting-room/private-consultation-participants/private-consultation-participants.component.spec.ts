import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    LoggedParticipantResponse,
    ParticipantResponse,
    ParticipantResponseVho,
    ParticipantStatus,
    Role,
    RoomSummaryResponse
} from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { Participant } from 'src/app/shared/models/participant';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { consultationServiceSpyFactory } from 'src/app/testing/mocks/mock-consultation-service';
import { eventsServiceSpy, requestedConsultationMessageSubjectMock } from 'src/app/testing/mocks/mock-events-service';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';

import { PrivateConsultationParticipantsComponent } from './private-consultation-participants.component';

describe('PrivateConsultationParticipantsComponent', () => {
    let component: PrivateConsultationParticipantsComponent;

    let conference: ConferenceResponse;
    let consultationRequester: Participant;
    let consultationRequestee: Participant;
    let participantsObserverPanelMember: ParticipantResponseVho[];
    let participantsWinger: ParticipantResponseVho[];
    let participantsWitness: ParticipantResponseVho[];

    const mockAdalService = new MockAdalService();
    let adalService;
    let consultationService: jasmine.SpyObj<ConsultationService>;
    const eventsService = eventsServiceSpy;

    let logger: jasmine.SpyObj<Logger>;
    let videoWebService: jasmine.SpyObj<VideoWebService>;

    let timer: jasmine.SpyObj<NodeJS.Timeout>;
    const testdata = new ConferenceTestData();
    let logged: LoggedParticipantResponse;
    let activatedRoute: ActivatedRoute;

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
        consultationRequester = new Participant(conference.participants[0]);
        consultationRequestee = new Participant(conference.participants[1]);
        activatedRoute = <any>{
            snapshot: { data: { loggedUser: logged } }
        };

        timer = jasmine.createSpyObj<NodeJS.Timer>('NodeJS.Timer', ['ref', 'unref']);
        component = new PrivateConsultationParticipantsComponent(adalService, consultationService, eventsService, logger, videoWebService);

        component.conference = conference;

        component.loggedInUser = logged;
        component.setupSubscribers();
    });

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
        expect(component.getRowClasses(p)).toEqual('govuk-table__row');
    });

    it('should get yellow row classes', () => {
        component.roomLabel = 'test-room';
        const p = conference.participants[0];
        p.current_room.label = 'test-room';
        expect(component.getRowClasses(p)).toEqual('govuk-table__row yellow');
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
});
