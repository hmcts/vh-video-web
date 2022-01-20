import { ActivatedRoute } from '@angular/router';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponse,
    LoggedParticipantResponse,
    ParticipantResponse,
    ParticipantResponseVho,
    ParticipantStatus,
    Role
} from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { consultationServiceSpyFactory } from 'src/app/testing/mocks/mock-consultation.service';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { MockOidcSecurityService } from 'src/app/testing/mocks/mock-oidc-security.service';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { IndividualParticipantStatusListComponent } from '../individual-participant-status-list.component';

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

    it('should return participant available status css class', () => {
        const participant = component.conference.participants[0];
        participant.status = ParticipantStatus.Available;
        expect(component.getParticipantStatusCss(participant)).toEqual('available');
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

    describe('getParticipantStatus', () => {
        let participant: ParticipantResponse;
        const allStatuses = Object.values(ParticipantStatus);
        beforeEach(() => {
            participant = new ParticipantResponse();
        });

        it('should return status when has no linked participants', () => {
            participant.linked_participants = [];
            allStatuses.forEach(status => {
                participant.status = status;
                expect(component.getParticipantStatus(participant)).toEqual(status);
            });
        });

        describe('has linked participant', () => {
            const availableStatuses = [ParticipantStatus.Available, ParticipantStatus.InConsultation];
            const mainParticipantStatus = ParticipantStatus.Available;
            allStatuses.forEach(status => {
                it(`should return null when linked participant is not available or status when available ${status}`, () => {
                    component.nonJudgeParticipants = [
                        {
                            id: '1',
                            status: status
                        } as any
                    ];
                    participant.status = mainParticipantStatus;
                    participant.linked_participants = [
                        {
                            linked_id: '1'
                        } as any
                    ];
                    if (availableStatuses.includes(status)) {
                        expect(component.getParticipantStatus(participant)).toEqual(mainParticipantStatus);
                    } else {
                        expect(component.getParticipantStatus(participant)).toBeNull();
                    }
                });
            });
        });
    });

    it('should return true for logged in participant', () => {
        const participant = component.conference.participants[0];
        component.loggedInUser.participant_id = participant.id;
        expect(component.isLoggedInParticipant(participant)).toBeTrue();
    });
});
