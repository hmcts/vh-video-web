import { ActivatedRoute } from '@angular/router';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { LoggedParticipantResponse, ParticipantResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { consultationServiceSpyFactory } from 'src/app/testing/mocks/mock-consultation.service';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { MockOidcSecurityService } from 'src/app/testing/mocks/mock-oidc-security.service';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { IndividualParticipantStatusListComponent } from '../individual-participant-status-list.component';
import { FocusService } from 'src/app/services/focus.service';
import { VHConference, VHLinkedParticipant, VHParticipant } from '../../store/models/vh-conference';
import { mapConferenceToVHConference } from '../../store/models/api-contract-to-state-model-mappers';

describe('IndividualParticipantStatusListComponent consultations', () => {
    let component: IndividualParticipantStatusListComponent;
    let conference: VHConference;
    let participantsObserverPanelMember: ParticipantResponse[];
    let participantsWinger: ParticipantResponse[];
    let participantsWitness: ParticipantResponse[];

    const mockOidcSecurityService = new MockOidcSecurityService();
    let oidcSecurityService;
    let consultationService: jasmine.SpyObj<ConsultationService>;
    const eventsService = eventsServiceSpy;

    let logger: jasmine.SpyObj<Logger>;
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    const testdata = new ConferenceTestData();
    let logged: LoggedParticipantResponse;
    let activatedRoute: ActivatedRoute;
    const translateService = translateServiceSpy;
    let focusServiceSpy: jasmine.SpyObj<FocusService>;

    beforeAll(() => {
        focusServiceSpy = jasmine.createSpyObj<FocusService>('FocusService', ['restoreFocus', 'storeFocus']);
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
        conference = mapConferenceToVHConference(new ConferenceTestData().getConferenceDetailFuture());
        conference.participants.forEach(p => {
            p.status = ParticipantStatus.Available;
        });
        const judge = conference.participants.find(x => x.role === Role.Judge);

        logged = new LoggedParticipantResponse({
            participant_id: judge.id,
            display_name: judge.displayName,
            role: Role.Judge
        });
        activatedRoute = <any>{
            snapshot: { data: { loggedUser: logged } }
        };

        component = new IndividualParticipantStatusListComponent(
            consultationService,
            eventsService,
            logger,
            videoWebService,
            activatedRoute,
            translateService,
            focusServiceSpy
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
        let participant: VHParticipant;
        const allStatuses = Object.values(ParticipantStatus);
        beforeEach(() => {
            participant = jasmine.createSpyObj<VHParticipant>('VHParticipant', ['linkedParticipants', 'status']);
        });

        it('should return status when has no linked participants', () => {
            participant.linkedParticipants = [];
            allStatuses.forEach(status => {
                participant.status = status;
                expect(component.getParticipantStatus(participant)).toEqual(status);
            });
        });

        describe('has linked participant', () => {
            const availableStatuses = [ParticipantStatus.Available, ParticipantStatus.InConsultation];
            const mainParticipantStatus = ParticipantStatus.Available;

            allStatuses.forEach(status => {
                const expectedStatus = availableStatuses.includes(status) ? mainParticipantStatus : null;
                const testCase = `should return ${expectedStatus} when linked participant status is ${status}`;

                it(testCase, () => {
                    const nonJudgeParticipant = jasmine.createSpyObj<VHParticipant>('VHParticipant', ['linkedParticipants', 'status']);
                    nonJudgeParticipant.id = '1';
                    nonJudgeParticipant.status = status;
                    const linkedParticipant = jasmine.createSpyObj<VHLinkedParticipant>('VHLinkedParticipant', ['linkedId']);
                    linkedParticipant.linkedId = '1';

                    component.nonJudgeParticipants = [nonJudgeParticipant];
                    participant.status = mainParticipantStatus;
                    participant.linkedParticipants = [linkedParticipant];

                    expect(component.getParticipantStatus(participant)).toEqual(expectedStatus);
                });
            });
        });
    });
});
