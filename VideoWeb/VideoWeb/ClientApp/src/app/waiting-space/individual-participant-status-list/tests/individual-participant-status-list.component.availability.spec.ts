import { ActivatedRoute } from '@angular/router';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { LoggedParticipantResponse, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { consultationServiceSpyFactory } from 'src/app/testing/mocks/mock-consultation.service';
import { eventsServiceSpy, participantStatusSubjectMock } from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { IndividualParticipantStatusListComponent } from '../individual-participant-status-list.component';
import { FocusService } from 'src/app/services/focus.service';
import {
    mapConferenceToVHConference,
    mapEndpointToVHEndpoint,
    mapParticipantToVHParticipant
} from '../../store/models/api-contract-to-state-model-mappers';
import { VHConference, VHParticipant } from '../../store/models/vh-conference';

describe('IndividualParticipantStatusListComponent Participant Status and Availability', () => {
    let component: IndividualParticipantStatusListComponent;
    let consultationService: jasmine.SpyObj<ConsultationService>;
    const eventsService = eventsServiceSpy;
    const participantStatusSubject = participantStatusSubjectMock;
    const logger: Logger = new MockLogger();
    let videoWebService: jasmine.SpyObj<VideoWebService>;

    let conference: VHConference;
    let participantsObserverPanelMember: VHParticipant[];
    let participantsWinger: VHParticipant[];
    let activatedRoute: ActivatedRoute;
    let logged: LoggedParticipantResponse;
    const translateService = translateServiceSpy;
    let focusServiceSpy: jasmine.SpyObj<FocusService>;

    beforeAll(() => {
        focusServiceSpy = jasmine.createSpyObj<FocusService>('FocusService', ['restoreFocus', 'storeFocus']);
        conference = mapConferenceToVHConference(new ConferenceTestData().getConferenceDetailFuture());
        participantsObserverPanelMember = new ConferenceTestData()
            .getListOfParticipantsObserverAndPanelMembers()
            .map(x => mapParticipantToVHParticipant(x));
        participantsWinger = new ConferenceTestData().getListOfParticipantsWingers().map(x => mapParticipantToVHParticipant(x));

        consultationService = consultationServiceSpyFactory();

        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getObfuscatedName']);
        videoWebService.getObfuscatedName.and.returnValue('t***** u*****');
        logged = new LoggedParticipantResponse({
            participant_id: conference.participants[2].id,
            display_name: 'Jonh Doe',
            role: Role.Judge
        });
    });

    beforeEach(() => {
        translateService.instant.calls.reset();
        activatedRoute = <any>{
            snapshot: { data: { loggedUser: logged } }
        };

        consultationService.clearModals.calls.reset();
        component = new IndividualParticipantStatusListComponent(
            consultationService,
            eventsService,
            logger,
            videoWebService,
            activatedRoute,
            translateService,
            focusServiceSpy
        );
        conference = mapConferenceToVHConference(new ConferenceTestData().getConferenceDetailFuture());
        component.conference = conference;
        component.loggedInUser = new LoggedParticipantResponse({
            participant_id: conference.participants[2].id,
            display_name: 'Jonh Doe',
            role: Role.Judge
        });
        component.addSharedEventHubSubcribers();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    const participantStatusTestCases = [
        { status: ParticipantStatus.Available, expected: 'individual-participant-status-list.available' },
        { status: ParticipantStatus.InConsultation, expected: 'individual-participant-status-list.unavailable' },
        { status: ParticipantStatus.InHearing, expected: 'individual-participant-status-list.unavailable' },
        { status: ParticipantStatus.Disconnected, expected: 'individual-participant-status-list.unavailable' },
        { status: ParticipantStatus.Joining, expected: 'individual-participant-status-list.unavailable' },
        { status: ParticipantStatus.NotSignedIn, expected: 'individual-participant-status-list.unavailable' },
        { status: ParticipantStatus.None, expected: 'individual-participant-status-list.unavailable' }
    ];

    participantStatusTestCases.forEach(test => {
        it(`should return text "${test.expected}" when participant status is ${test.status}`, () => {
            const pat = component.conference.participants[0];
            pat.status = test.status;
            expect(component.getParticipantStatusText(pat)).toBe(test.expected);
        });
    });

    const handleParticipantStatus = [
        { status: ParticipantStatus.Available },
        { status: ParticipantStatus.InHearing },
        { status: ParticipantStatus.Disconnected },
        { status: ParticipantStatus.Joining },
        { status: ParticipantStatus.NotSignedIn },
        { status: ParticipantStatus.None }
    ];

    handleParticipantStatus.forEach(test => {
        it(`should take no action user receives participant status message with status ${test.status}`, () => {
            const participant = component.conference.participants.filter(x => x.role === Role.Individual)[0];
            const payload = new ParticipantStatusMessage(participant.id, '', conference.id, test.status);

            participantStatusSubject.next(payload);
            expect(consultationService.clearModals).toHaveBeenCalledTimes(0);
        });
    });

    it('should close all modals user receives in consultation message', () => {
        const participant = component.conference.participants.filter(x => x.id === component.loggedInUser.participant_id)[0];

        const payload = new ParticipantStatusMessage(participant.id, '', conference.id, ParticipantStatus.InConsultation);

        participantStatusSubject.next(payload);
        expect(consultationService.clearModals).toHaveBeenCalledTimes(1);
    });

    it('should show observers, panel members, endpoints, wingers and participants', () => {
        participantsObserverPanelMember.forEach(x => {
            component.conference.participants.push(x);
        });
        participantsWinger.forEach(x => {
            component.conference.participants.push(x);
        });
        const endpoints = new ConferenceTestData().getListOfEndpoints().map(x => mapEndpointToVHEndpoint(x));
        conference.endpoints = endpoints;
        component.ngOnInit();

        expect(component.nonJudgeParticipants).toBeDefined();
        expect(component.nonJudgeParticipants.length).toBe(2);

        expect(component.observers).toBeDefined();
        expect(component.observers.length).toBe(2);

        expect(component.panelMembers).toBeDefined();
        expect(component.panelMembers.length).toBe(1);

        expect(component.staffMembers).toBeDefined();
        expect(component.staffMembers.length).toBe(1);

        expect(component.wingers).toBeDefined();
        expect(component.wingers.length).toBe(1);

        expect(component.participantCount).toBe(7);
        expect(component.endpoints).toBeDefined();
        expect(component.endpoints.length).toBe(2);
    });
});
