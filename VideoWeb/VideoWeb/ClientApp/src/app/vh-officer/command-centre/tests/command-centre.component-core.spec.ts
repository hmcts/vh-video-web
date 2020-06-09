import { discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ConferenceResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { Hearing } from 'src/app/shared/models/hearing';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ScreenHelper } from 'src/app/shared/screen-helper';
import { TestFixtureHelper } from 'src/app/testing/Helper/test-fixture-helper';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { MenuOption } from '../../models/menus-options';
import { VhoQueryService } from '../../services/vho-query-service.service';
import { CommandCentreComponent } from '../command-centre.component';
import { EventBusService } from 'src/app/services/event-bus.service';

describe('CommandCentreComponent - Core', () => {
    let component: CommandCentreComponent;

    let vhoQueryService: jasmine.SpyObj<VhoQueryService>;
    let screenHelper: jasmine.SpyObj<ScreenHelper>;
    const logger: Logger = new MockLogger();
    const conferences = new ConferenceTestData().getVhoTestData();
    const hearings = conferences.map(c => new HearingSummary(c));
    let errorService: jasmine.SpyObj<ErrorService>;
    let eventsService: jasmine.SpyObj<EventsService>;
    const mockEventService = new MockEventsService();
    let router: jasmine.SpyObj<Router>;
    let eventBusServiceSpy: jasmine.SpyObj<EventBusService>;

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
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    afterAll(() => {
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
            eventBusServiceSpy
        );
        component.hearings = hearings;
        screenHelper.enableFullScreen.calls.reset();
        vhoQueryService.getConferenceByIdVHO.calls.reset();
    });

    it('should go fullscreen on init', fakeAsync(() => {
        component.loadingData = false;
        component.hearings = undefined;
        component.conferencesSubscription = undefined;

        component.ngOnInit();
        discardPeriodicTasks();

        expect(screenHelper.enableFullScreen).toHaveBeenCalledWith(true);
        expect(component.hearings.length).toBeGreaterThan(0);
        expect(component.conferencesSubscription).toBeDefined();
    }));

    it('should remove fullscreen on destroy', () => {
        component.ngOnDestroy();
        expect(screenHelper.enableFullScreen).toHaveBeenCalledWith(false);
    });

    it('should go back to venue list selection page', () => {
        component.goBackToVenueSelection();
        expect(router.navigateByUrl).toHaveBeenCalledWith(pageUrls.AdminVenueList);
    });

    it('should load venue selection', () => {
        component.loadVenueSelection();
        expect(component.venueAllocations).toBeDefined();
    });

    it('should return true when current conference is selected', () => {
        const currentConference = conferences[0];
        component.selectedHearing = new Hearing(new ConferenceResponse({ id: currentConference.id }));
        expect(component.isCurrentConference(currentConference.id)).toBeTruthy();
    });

    it('should handle api error when retrieving conference list fails', fakeAsync(() => {
        const error = { status: 404, isApiException: true };
        vhoQueryService.getConferencesForVHOfficer.and.returnValue(throwError(error));
        errorService.handleApiError.and.callFake(() => {
            Promise.resolve(true);
        });
        tick();
        component.retrieveHearingsForVhOfficer(true);
        expect(errorService.handleApiError).toHaveBeenCalledWith(error);
    }));

    it('should clear selected conference', () => {
        const currentConference = conferences[0];
        component.selectedHearing = new Hearing(new ConferenceResponse({ id: currentConference.id }));

        component.clearSelectedConference();

        expect(component.selectedHearing).toBeNull();
    });

    it('should get conference details on selection', () => {
        const currentConference = conferences[0];
        component.selectedHearing = null;

        component.onConferenceSelected(currentConference);

        expect(vhoQueryService.getConferenceByIdVHO).toHaveBeenCalledWith(currentConference.id);
    });

    it('should not get conference details if already selected', () => {
        const currentConference = conferences[0];
        component.selectedHearing = new Hearing(new ConferenceResponse({ id: currentConference.id }));

        component.onConferenceSelected(currentConference);

        expect(vhoQueryService.getConferenceByIdVHO).toHaveBeenCalledTimes(0);
    });

    it('should map hearing on conference retrieval', async () => {
        component.selectedHearing = null;
        const confId = conferences[0].id;
        await component.retrieveConferenceDetails(confId);

        expect(component.selectedHearing).toBeDefined();
    });

    it('should handle api error when retrieving conference details fails', fakeAsync(() => {
        const error = { status: 404, isApiException: true };
        vhoQueryService.getConferenceByIdVHO.and.callFake(() => Promise.reject(error));
        errorService.handleApiError.and.callFake(() => {
            Promise.resolve(true);
        });
        tick();
        component.retrieveConferenceDetails(conferences[0].id);
        expect(errorService.handleApiError).toHaveBeenCalledWith(error);
    }));

    it('should update selectedMenu', () => {
        const menu = MenuOption.Message;

        component.onMenuSelected(menu);

        expect(component.selectedMenu).toBe(menu);
    });
});
