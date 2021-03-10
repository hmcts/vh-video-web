import { ActivatedRoute } from '@angular/router';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    ConferenceStatus,
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
import { requestedConsultationMessageSubjectMock, eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { HearingRole } from '../../models/hearing-role-model';
import { IndividualParticipantStatusListComponent } from '../individual-participant-status-list.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation-service';

describe('IndividualParticipantStatusListComponent consultations', () => {
    let component: IndividualParticipantStatusListComponent;
    let conference: ConferenceResponse;
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
    const translateService = translateServiceSpy;

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
        activatedRoute = <any>{
            snapshot: { data: { loggedUser: logged } }
        };

        timer = jasmine.createSpyObj<NodeJS.Timer>('NodeJS.Timer', ['ref', 'unref']);
        component = new IndividualParticipantStatusListComponent(
            adalService,
            consultationService,
            eventsService,
            logger,
            videoWebService,
            activatedRoute,
            translateService
        );

        component.conference = conference;

        component.loggedInUser = logged;
        component.setupSubscribers();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should init properties and setup ringtone on init', async () => {
        component.ngOnInit();
        expect(component).toBeTruthy();
        expect(component.judge).toBeDefined();
        expect(component.nonJudgeParticipants).toBeDefined();
    });

    it('should not be able to call participant is user is judge', () => {
        component.loggedInUser = logged;
        const participant = new ParticipantResponse({
            status: ParticipantStatus.InConsultation,
            id: component.loggedInUser.participant_id
        });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call an unavailable participant', () => {
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, id: conference.participants[0].id });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call self', () => {
        component.loggedInUser = logged;
        component.conference = new ConferenceTestData().getConferenceDetailFuture();
        const participant = new ParticipantResponse({
            status: ParticipantStatus.InConsultation,
            id: component.loggedInUser.participant_id
        });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call when hearing is about to start', () => {
        component.loggedInUser = logged;

        const participant = new ParticipantResponse({
            status: ParticipantStatus.InConsultation,
            id: component.loggedInUser.participant_id
        });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call when hearing is delayed', () => {
        component.loggedInUser = logged;

        component.conference = new ConferenceTestData().getConferenceDetailPast();
        const participant = new ParticipantResponse({
            status: ParticipantStatus.InConsultation,
            id: component.loggedInUser.participant_id
        });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call when hearing is suspended', () => {
        component.loggedInUser = logged;

        component.conference.status = ConferenceStatus.Suspended;
        const participant = new ParticipantResponse({
            status: ParticipantStatus.InConsultation,
            id: component.loggedInUser.participant_id
        });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should be able to call an available participant', () => {
        const participant = new ParticipantResponse({ status: ParticipantStatus.Available, id: conference.participants[0].id });
        expect(component.canCallParticipant(participant)).toBeTruthy();
    });

    it('should close all modals when user clicks close on modal', () => {
        component.closeAllPCModals();
        expect(consultationService.clearModals).toHaveBeenCalledTimes(1);
    });

    it('should not be able to call participant if user is observer', () => {
        component.conference.scheduled_date_time = new Date(new Date(Date.now()).getTime() + 31 * 60000);

        participantsObserverPanelMember.forEach(x => {
            component.conference.participants.push(x);
        });
        const observer = component.conference.participants.find(x => x.hearing_role === HearingRole.OBSERVER);
        component.loggedInUser.participant_id = observer.id;
        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, id: '12345' });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call participant if user is panel member', () => {
        component.conference.scheduled_date_time = new Date(new Date(Date.now()).getTime() + 31 * 60000);

        participantsObserverPanelMember.forEach(x => {
            component.conference.participants.push(x);
        });
        const panelMember = component.conference.participants.find(x => x.hearing_role === HearingRole.PANEL_MEMBER);
        component.loggedInUser.participant_id = panelMember.id;

        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, id: '12345' });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call participant if user is winger', () => {
        component.conference.scheduled_date_time = new Date(new Date(Date.now()).getTime() + 31 * 60000);

        participantsWinger.forEach(x => {
            component.conference.participants.push(x);
        });
        const wingerMember = component.conference.participants.find(x => x.hearing_role === HearingRole.WINGER);
        component.loggedInUser.participant_id = wingerMember.id;

        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, id: '12345' });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should not be able to call participant if user is a witness', () => {
        component.conference.scheduled_date_time = new Date(new Date(Date.now()).getTime() + 31 * 60000);

        participantsWitness.forEach(x => {
            component.conference.participants.push(x);
        });
        const witnessMember = component.conference.participants.find(x => x.hearing_role === HearingRole.WITNESS);
        component.loggedInUser.participant_id = witnessMember.id;

        const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, id: '1234' });
        expect(component.canCallParticipant(participant)).toBeFalsy();
    });

    it('should return participant unavailable status css class', () => {
        const participant = component.conference.participants[0];
        participant.status = ParticipantStatus.Disconnected;
        expect(component.getParticipantStatusCss(participant)).toEqual('unavailable');
    });

    it('should return participant in consultation status css class', () => {
        const participant = component.conference.participants[0];
        participant.status = ParticipantStatus.InConsultation;
        expect(component.getParticipantStatusCss(participant)).toEqual('in-consultation');
    });

    it('should not return status css class', () => {
        const participant = component.conference.participants[0];
        participant.status = ParticipantStatus.InConsultation;
        expect(component.getParticipantStatusCss(participant)).toEqual('in-consultation');
    });

    it('should return participant unavailable status', () => {
        const participant = component.conference.participants[0];
        participant.status = ParticipantStatus.Disconnected;
        expect(component.getParticipantStatus(participant)).toEqual('Unavailable');
    });

    it('should return participant in consultation status', () => {
        const participant = component.conference.participants[0];
        participant.status = ParticipantStatus.InConsultation;
        participant.current_room = new RoomSummaryResponse();
        participant.current_room.label = 'MeetingRoom1';
        expect(component.getParticipantStatus(participant)).toEqual('In meeting room 1');
    });
});
