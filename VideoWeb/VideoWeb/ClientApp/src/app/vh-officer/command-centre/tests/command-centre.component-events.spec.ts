import { Router } from '@angular/router';
import { Guid } from 'guid-typescript';
import { of } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponseVho, ConferenceStatus, ParticipantStatus } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { Hearing } from 'src/app/shared/models/hearing';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { ScreenHelper } from 'src/app/shared/screen-helper';
import { TestFixtureHelper } from 'src/app/testing/Helper/test-fixture-helper';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { CommandCentreComponent } from '../command-centre.component';
import { VhoQueryService } from 'src/app/services/vho-query-service.service';

describe('CommandCentreComponent - Events', () => {
    let component: CommandCentreComponent;

    let vhoQueryService: jasmine.SpyObj<VhoQueryService>;
    let screenHelper: jasmine.SpyObj<ScreenHelper>;
    let errorService: jasmine.SpyObj<ErrorService>;
    let eventsService: jasmine.SpyObj<EventsService>;
    let router: jasmine.SpyObj<Router>;

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

        vhoQueryService = jasmine.createSpyObj<VhoQueryService>('VhoQueryService', ['getConferencesForVHOfficer', 'getConferenceByIdVHO']);

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
            'getServiceReconnected'
        ]);
        eventsService.getHearingStatusMessage.and.returnValue(mockEventService.hearingStatusSubject.asObservable());
        eventsService.getParticipantStatusMessage.and.returnValue(mockEventService.participantStatusSubject.asObservable());
        eventsService.getServiceDisconnected.and.returnValue(mockEventService.eventHubDisconnectSubject.asObservable());
        eventsService.getServiceReconnected.and.returnValue(mockEventService.eventHubReconnectSubject.asObservable());
    });

    afterAll(() => {
        component.ngOnDestroy();
        TestFixtureHelper.clearVenues();
    });

    beforeEach(() => {
        vhoQueryService.getConferencesForVHOfficer.and.returnValue(of(conferences));
        vhoQueryService.getConferenceByIdVHO.and.returnValue(Promise.resolve(conferenceDetail));

        component = new CommandCentreComponent(vhoQueryService, errorService, eventsService, logger, router, screenHelper);
        component.conferences = hearings;
        component.selectedHearing = hearing;
        screenHelper.enableFullScreen.calls.reset();
        vhoQueryService.getConferenceByIdVHO.calls.reset();
    });

    it('should update hearing status when conference status message is received', () => {
        component.setupEventHubSubscribers();
        component.conferences[0].status = ConferenceStatus.InSession;
        const message = new ConferenceStatusMessage(conferences[0].id, ConferenceStatus.Paused);

        mockEventService.hearingStatusSubject.next(message);

        expect(component.conferences[0].status).toBe(message.status);
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

        component.conferences[1].getConference().id = conferenceId;
        component.conferences[1].getParticipants()[1].base.id = participant.id;

        participant.status = ParticipantStatus.Joining;
        const message = new ParticipantStatusMessage(participant.id, participant.username, conferenceId, ParticipantStatus.Available);

        mockEventService.participantStatusSubject.next(message);

        expect(component.conferences[1].getParticipants()[1].status).toBe(message.status);
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
});
