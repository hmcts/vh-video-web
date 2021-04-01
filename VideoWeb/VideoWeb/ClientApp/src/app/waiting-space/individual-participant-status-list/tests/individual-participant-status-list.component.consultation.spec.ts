import { ActivatedRoute } from '@angular/router';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    LoggedParticipantResponse,
    ParticipantResponseVho,
    ParticipantStatus,
    Role,
    RoomSummaryResponse
} from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { consultationServiceSpyFactory } from 'src/app/testing/mocks/mock-consultation.service';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { MockOidcSecurityService } from 'src/app/testing/mocks/mock-oidc-security.service';
import { IndividualParticipantStatusListComponent } from '../individual-participant-status-list.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';

describe('IndividualParticipantStatusListComponent consultations', () => {
    let component: IndividualParticipantStatusListComponent;
    let conference: ConferenceResponse;
    let participantsObserverPanelMember: ParticipantResponseVho[];
    let participantsWinger: ParticipantResponseVho[];
    let participantsWitness: ParticipantResponseVho[];

    const mockOidcSecurityService = new MockOidcSecurityService();
    let oidcSecurityService;
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
        oidcSecurityService = mockOidcSecurityService;

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
            consultationService,
            eventsService,
            logger,
            videoWebService,
            activatedRoute,
            translateService
        );

        component.conference = conference;

        component.loggedInUser = logged;
        component.addSharedEventHubSubcribers();
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

    it('should close all modals when user clicks close on modal', () => {
        component.closeAllPCModals();
        expect(consultationService.clearModals).toHaveBeenCalledTimes(1);
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

    it('should return unavailable status', () => {
        const participant = component.conference.participants[0];
        component.nonJudgeParticipants = [
            {
                id: '1',
                status: ParticipantStatus.NotSignedIn
            } as any
        ];
        participant.status = ParticipantStatus.Available;
        participant.linked_participants = [
            {
                linked_id: '1'
            } as any
        ];
        expect(component.getParticipantStatus(participant)).toEqual('Unavailable');
    });
});
