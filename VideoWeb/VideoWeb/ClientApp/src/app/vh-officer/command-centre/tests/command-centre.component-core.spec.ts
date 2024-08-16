import { fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ConfigService } from 'src/app/services/api/config.service';
import { ClientSettingsResponse, ConferenceResponse, SupplierConfigurationResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventBusService } from 'src/app/services/event-bus.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { Hearing } from 'src/app/shared/models/hearing';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ScreenHelper } from 'src/app/shared/screen-helper';
import { TestFixtureHelper } from 'src/app/testing/Helper/test-fixture-helper';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { SessionStorage } from '../../../services/session-storage';
import { MenuOption } from '../../models/menus-options';
import { CourtRoomsAccounts } from '../../services/models/court-rooms-accounts';
import { VhoStorageKeys } from '../../services/models/session-keys';
import { VhoQueryService } from '../../services/vho-query-service.service';
import { CommandCentreComponent } from '../command-centre.component';
import { FEATURE_FLAGS, LaunchDarklyService } from '../../../services/launch-darkly.service';
import { NotificationToastrService } from '../../../waiting-space/services/notification-toastr.service';

describe('CommandCentreComponent - Core', () => {
    let component: CommandCentreComponent;

    let vhoQueryService: jasmine.SpyObj<VhoQueryService>;
    let screenHelper: jasmine.SpyObj<ScreenHelper>;
    let configService: jasmine.SpyObj<ConfigService>;
    const logger: Logger = new MockLogger();
    const conferences = new ConferenceTestData().getTestData();
    const hearings = conferences.map(c => new HearingSummary(c));
    let errorService: jasmine.SpyObj<ErrorService>;
    let router: jasmine.SpyObj<Router>;
    let eventBusServiceSpy: jasmine.SpyObj<EventBusService>;
    let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;
    let notificationToastrServiceSpy: jasmine.SpyObj<NotificationToastrService>;

    const conferenceDetail = new ConferenceTestData().getConferenceDetailFuture();

    beforeAll(() => {
        TestFixtureHelper.setupVenues();

        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
        screenHelper = jasmine.createSpyObj<ScreenHelper>('ScreenHelper', ['enableFullScreen']);
        configService = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings']);

        vhoQueryService = jasmine.createSpyObj<VhoQueryService>(
            'VhoQueryService',
            [
                'startQuery',
                'stopQuery',
                'getFilteredQueryResults',
                'getConferencesForVHOfficer',
                'getConferenceByIdVHO',
                'getCsoFilterFromStorage',
                'getAvailableCourtRoomFilters',
                'getCsoFilterFromStorage'
            ],
            ['courtRoomFilterChanged$']
        );

        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', [
            'goToServiceError',
            'handleApiError',
            'returnHomeIfUnauthorised'
        ]);

        eventBusServiceSpy = jasmine.createSpyObj<EventBusService>('EventBusService', ['emit', 'on']);
        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
        notificationToastrServiceSpy = jasmine.createSpyObj('NotificationToastrService', ['createAllocationNotificationToast']);
        const config = new ClientSettingsResponse({
            supplier_configurations: [
                new SupplierConfigurationResponse({ supplier: 'kinly', join_by_phone_from_date: '2020-09-01' }),
                new SupplierConfigurationResponse({ supplier: 'vodafone', join_by_phone_from_date: '2020-09-01' })
            ]
        });
        configService.getClientSettings.and.returnValue(of(config));
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    afterAll(() => {
        TestFixtureHelper.clearVenues();
    });

    beforeEach(() => {
        vhoQueryService.getConferencesForVHOfficer.and.returnValue(of(conferences));
        vhoQueryService.getFilteredQueryResults.and.returnValue(of(conferences));

        const courtRoomAccounts: CourtRoomsAccounts[] = [];
        courtRoomAccounts.push(new CourtRoomsAccounts('Birmingham', ['Judge Fudge'], true));
        vhoQueryService.getAvailableCourtRoomFilters.and.returnValue(of(courtRoomAccounts));
        spyOnProperty(vhoQueryService, 'courtRoomFilterChanged$').and.returnValue(
            new BehaviorSubject<CourtRoomsAccounts[]>(courtRoomAccounts)
        );

        vhoQueryService.getConferenceByIdVHO.and.returnValue(Promise.resolve(conferenceDetail));

        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.vhoWorkAllocation, jasmine.any(Boolean)).and.returnValue(of(true));

        component = new CommandCentreComponent(
            vhoQueryService,
            errorService,
            eventsServiceSpy,
            logger,
            router,
            screenHelper,
            eventBusServiceSpy,
            configService,
            launchDarklyServiceSpy,
            notificationToastrServiceSpy
        );
        component.hearings = hearings;
        screenHelper.enableFullScreen.calls.reset();
        vhoQueryService.getConferenceByIdVHO.calls.reset();
    });

    it('should go fullscreen on init', fakeAsync(() => {
        component.loadingData = false;
        component.hearings = undefined;

        component.ngOnInit();
        tick();

        expect(screenHelper.enableFullScreen).toHaveBeenCalledWith(true);
        expect(component.hearings.length).toBeGreaterThan(0);
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
        vhoQueryService.getFilteredQueryResults.and.returnValue(throwError(error));
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

    it('should filter hearings by selected court rooms, all venues and rooms are selected', () => {
        const filter = [new CourtRoomsAccounts('judge', ['fudge'], true), new CourtRoomsAccounts('manual', ['manual1', 'manual2'], true)];
        const courtAccountsAllocationStorage = new SessionStorage<CourtRoomsAccounts[]>(VhoStorageKeys.COURT_ROOMS_ACCOUNTS_ALLOCATION_KEY);
        courtAccountsAllocationStorage.set(filter);
        const numberHearing = component.hearings.length;

        hearings.forEach(x => component.originalHearings.push(x));

        component.applyFilter(filter);
        expect(component.hearings.length).toBe(numberHearing);
    });

    it('should filter hearings by selected court rooms', () => {
        const filter = [new CourtRoomsAccounts('manual', ['manual1', 'manual2'], false), new CourtRoomsAccounts('judge', ['fudge'], false)];
        filter[0].courtsRooms[0].selected = true;
        filter[1].courtsRooms[0].selected = false;

        const courtAccountsAllocationStorage = new SessionStorage<CourtRoomsAccounts[]>(VhoStorageKeys.COURT_ROOMS_ACCOUNTS_ALLOCATION_KEY);
        courtAccountsAllocationStorage.set(filter);

        const conferencesFilter = new ConferenceTestData().getConferenceNow();
        const judge = conferencesFilter.participants.filter(p => p.role === 'Judge');
        judge[0].first_name = 'manual';
        judge[0].last_name = 'manual1';

        component.hearings.push(new HearingSummary(conferencesFilter));
        component.hearings.forEach(x => component.originalHearings.push(x));

        component.applyFilter(filter);
        expect(component.hearings.length).toBe(1);
        expect(component.hearings[0].getParticipants().filter(p => p.isJudge)[0].firstName).toBe('manual');
    });
    it('should hide the hearings if selected venues are not match judge first name or venue is not selected', () => {
        const filter = [new CourtRoomsAccounts('manual', ['manual1', 'manual2'], false), new CourtRoomsAccounts('judge', ['fudge'], false)];
        filter[0].courtsRooms[0].selected = false;
        filter[0].courtsRooms[1].selected = false;
        filter[1].courtsRooms[0].selected = false;

        const courtAccountsAllocationStorage = new SessionStorage<CourtRoomsAccounts[]>(VhoStorageKeys.COURT_ROOMS_ACCOUNTS_ALLOCATION_KEY);

        courtAccountsAllocationStorage.set(filter);

        const conferencesFilter = new ConferenceTestData().getConferenceNow();
        const judge = conferencesFilter.participants.filter(p => p.role === 'Judge');
        judge[0].first_name = 'manual3';
        judge[0].last_name = 'manual1';

        component.hearings.push(new HearingSummary(conferencesFilter));
        component.hearings.forEach(x => component.originalHearings.push(x));

        component.applyFilter(filter);
        expect(component.hearings.length).toBe(0);
    });
    it('should convert string to date', () => {
        const dateFrom = component.getDateFromString('2021-02-09');
        expect(dateFrom.getFullYear()).toEqual(2021);
        expect(dateFrom.getMonth()).toEqual(1);
        expect(dateFrom.getDay()).toEqual(2);
    });
});
