import { ActivatedRoute, Router } from '@angular/router';
import { Guid } from 'guid-typescript';
import { of } from 'rxjs';
import { ClientSettingsResponse, ConferenceResponseVho, ConferenceStatus, ParticipantStatus } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { HeartbeatHealth, ParticipantHeartbeat } from 'src/app/services/models/participant-heartbeat';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { Hearing } from 'src/app/shared/models/hearing';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { ScreenHelper } from 'src/app/shared/screen-helper';
import { TestFixtureHelper } from 'src/app/testing/Helper/test-fixture-helper';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { VhoQueryService } from '../../services/vho-query-service.service';
import { CommandCentreComponent } from '../command-centre.component';
import { EventBusService } from 'src/app/services/event-bus.service';

describe('CommandCentreComponent - Events', () => {
    let component: CommandCentreComponent;
    let activatedRoute: ActivatedRoute;
    let vhoQueryService: jasmine.SpyObj<VhoQueryService>;
    let screenHelper: jasmine.SpyObj<ScreenHelper>;
    let errorService: jasmine.SpyObj<ErrorService>;
    let eventsService: jasmine.SpyObj<EventsService>;
    let router: jasmine.SpyObj<Router>;
    let eventBusServiceSpy: jasmine.SpyObj<EventBusService>;

    const logger: Logger = new MockLogger();
    const mockEventService = new MockEventsService();

    const conferences = new ConferenceTestData().getVhoTestData();
    const hearings = conferences.map(c => new HearingSummary(c));
    const conference = new ConferenceTestData().getConferenceDetailNow();
    const hearing = new Hearing(conference);

    const conferenceDetail = new ConferenceTestData().getConferenceDetailFuture();

    beforeAll(() => {
        TestFixtureHelper.setupVenues();

        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
        screenHelper = jasmine.createSpyObj<ScreenHelper>('ScreenHelper', ['enableFullScreen']);

        vhoQueryService = jasmine.createSpyObj<VhoQueryService>('VhoQueryService', [
            'startQuery',
            'stopQuery',
            'getConferencesForVHOfficer',
            'getConferenceByIdVHO'
        ]);

        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', [
            'goToServiceError',
            'handleApiError',
            'returnHomeIfUnauthorised'
        ]);

        eventsService = jasmine.createSpyObj<EventsService>('EventsService', [
            'start',
            'getHearingStatusMessage',
            'getParticipantStatusMessage',
            'getServiceDisconnected',
            'getServiceReconnected',
            'getHeartbeat'
        ]);
        eventsService.getHearingStatusMessage.and.returnValue(mockEventService.hearingStatusSubject.asObservable());
        eventsService.getParticipantStatusMessage.and.returnValue(mockEventService.participantStatusSubject.asObservable());
        eventsService.getServiceDisconnected.and.returnValue(mockEventService.eventHubDisconnectSubject.asObservable());
        eventsService.getServiceReconnected.and.returnValue(mockEventService.eventHubReconnectSubject.asObservable());
        eventsService.getHeartbeat.and.returnValue(mockEventService.participantHeartbeat.asObservable());

        eventBusServiceSpy = jasmine.createSpyObj<EventBusService>('EventBusService', ['emit', 'on']);
        const config = new ClientSettingsResponse({ join_by_phone_from_date: '' });
        activatedRoute = <any>{
            snapshot: {
                data: { configSettings: config }
            }
        };
    });

    afterAll(() => {
        component.ngOnDestroy();
        TestFixtureHelper.clearVenues();
    });

    beforeEach(() => {
        vhoQueryService.getConferencesForVHOfficer.and.returnValue(of(conferences));
        vhoQueryService.getConferenceByIdVHO.and.returnValue(Promise.resolve(conferenceDetail));

        component = new CommandCentreComponent(
            vhoQueryService,
            errorService,
            eventsService,
            logger,
            router,
            screenHelper,
            eventBusServiceSpy,
            activatedRoute
        );
        component.hearings = hearings;
        component.selectedHearing = hearing;
        screenHelper.enableFullScreen.calls.reset();
        vhoQueryService.getConferenceByIdVHO.calls.reset();
    });

    it('should update hearing status when conference status message is received', () => {
        component.setupEventHubSubscribers();
        component.hearings[0].status = ConferenceStatus.InSession;
        const message = new ConferenceStatusMessage(conferences[0].id, ConferenceStatus.Paused);

        mockEventService.hearingStatusSubject.next(message);

        expect(component.hearings[0].status).toBe(message.status);
    });

    it('should selected hearing status when conference status message is received for currently selected conference', () => {
        component.setupEventHubSubscribers();
        const clone: ConferenceResponseVho = Object.assign(conferenceDetail);
        component.selectedHearing = new Hearing(clone);
        component.selectedHearing.getConference().status = ConferenceStatus.InSession;
        const message = new ConferenceStatusMessage(component.selectedHearing.id, ConferenceStatus.Paused);

        mockEventService.hearingStatusSubject.next(message);

        expect(component.selectedHearing.status).toBe(message.status);
    });

    it('should not update conference status message is received for a conference not in list', () => {
        const message = new ConferenceStatusMessage(Guid.create().toString(), ConferenceStatus.Paused);
        expect(component.handleConferenceStatusChange(message)).toBeFalsy();
    });

    it('should update participant status when conference participant message is received', () => {
        component.setupEventHubSubscribers();
        const conferenceId = hearing.id;
        const participant = hearing.getParticipants()[0];

        component.hearings[1].getConference().id = conferenceId;
        component.hearings[1].getParticipants()[1].base.id = participant.id;

        participant.status = ParticipantStatus.Joining;
        const message = new ParticipantStatusMessage(participant.id, participant.username, conferenceId, ParticipantStatus.Available);

        mockEventService.participantStatusSubject.next(message);

        expect(component.hearings[1].getParticipants()[1].status).toBe(message.status);
        expect(component.selectedHearing.participants[0].status).toBe(message.status);
    });

    it('should gracefully handle participant updates', () => {
        const conferenceId = Guid.create().toString();
        const participantId = Guid.create().toString();
        const message = new ParticipantStatusMessage(participantId, 'test@usr.co', conferenceId, ParticipantStatus.Available);

        mockEventService.participantStatusSubject.next(message);

        expect(component).toBeTruthy();
    });

    it('should refresh data on eventhub disconnect', () => {
        spyOn(component, 'refreshConferenceDataDuringDisconnect');
        errorService.goToServiceError.calls.reset();

        component.setupEventHubSubscribers();
        mockEventService.eventHubDisconnectSubject.next(1);
        mockEventService.eventHubDisconnectSubject.next(2);
        mockEventService.eventHubDisconnectSubject.next(3);
        mockEventService.eventHubDisconnectSubject.next(4);
        mockEventService.eventHubDisconnectSubject.next(5);
        mockEventService.eventHubDisconnectSubject.next(6);

        expect(component.refreshConferenceDataDuringDisconnect).toHaveBeenCalledTimes(6);
        expect(errorService.goToServiceError).toHaveBeenCalledTimes(0);
    });

    it('should redirect to service error when disconnected more than 6 times', () => {
        spyOn(component, 'refreshConferenceDataDuringDisconnect');

        component.setupEventHubSubscribers();
        errorService.goToServiceError.calls.reset();
        mockEventService.eventHubDisconnectSubject.next(7);
        expect(component.refreshConferenceDataDuringDisconnect).toHaveBeenCalledTimes(0);
        expect(errorService.goToServiceError).toHaveBeenCalled();
    });

    it('should refresh data on eventhub reconnect', () => {
        spyOn(component, 'refreshConferenceDataDuringDisconnect');

        component.setupEventHubSubscribers();
        mockEventService.eventHubReconnectSubject.next();

        expect(component.refreshConferenceDataDuringDisconnect).toHaveBeenCalledTimes(1);
    });

    it('should not retrieve data on eventhub reconnect if no hearing is selected', async () => {
        component.selectedHearing = null;
        await component.refreshConferenceDataDuringDisconnect();

        expect(vhoQueryService.getConferenceByIdVHO).toHaveBeenCalledTimes(0);
    });

    it('should update participant heartbeat', async () => {
        const testHearing = component.hearings[0];
        const heartBeat = new ParticipantHeartbeat(
            testHearing.id,
            testHearing.getParticipants()[0].id,
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132',
            'Mac OS X',
            '10.15.1'
        );
        mockEventService.participantHeartbeat.next(heartBeat);
        expect(component.hearings[0].getParticipants()[0].participantHertBeatHealth).toBe(heartBeat);
    });

    it('should gracefully handle participant heartbeat not in list', () => {
        const testHearing = component.hearings[0];
        const heartBeat = new ParticipantHeartbeat(
            testHearing.id,
            Guid.create().toString(),
            HeartbeatHealth.Good,
            'Chrome',
            '80.0.3987.132',
            'Mac OS X',
            '10.15.1'
        );
        mockEventService.participantHeartbeat.next(heartBeat);

        expect(component).toBeTruthy();
    });
});
