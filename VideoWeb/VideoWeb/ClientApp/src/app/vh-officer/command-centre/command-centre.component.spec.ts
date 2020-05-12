import { Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ScreenHelper } from 'src/app/shared/screen-helper';
import { TestFixtureHelper } from 'src/app/testing/Helper/test-fixture-helper';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { CommandCentreComponent } from './command-centre.component';
import { Hearing } from 'src/app/shared/models/hearing';
import { ConferenceResponse } from 'src/app/services/clients/api-client';
import { fakeAsync, discardPeriodicTasks, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

describe('CommandCentreComponent', () => {
    let component: CommandCentreComponent;

    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let screenHelper: jasmine.SpyObj<ScreenHelper>;
    const logger: Logger = new MockLogger();
    const conferences = new ConferenceTestData().getVhoTestData();
    const hearings = conferences.map(c => new HearingSummary(c));
    let errorService: jasmine.SpyObj<ErrorService>;

    let router: jasmine.SpyObj<Router>;

    const conferenceDetail = new ConferenceTestData().getConferenceDetailFuture();

    beforeAll(() => {
        TestFixtureHelper.setupVenues();

        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
        screenHelper = jasmine.createSpyObj<ScreenHelper>('ScreenHelper', ['enableFullScreen']);

        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getConferencesForVHOfficer',
            'getConferenceByIdVHO'
        ]);

        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', [
            'goToServiceError',
            'handleApiError',
            'returnHomeIfUnauthorised'
        ]);
    });

    afterAll(() => {
        component.ngOnDestroy();
        TestFixtureHelper.clearVenues();
    });

    beforeEach(() => {
        videoWebServiceSpy.getConferencesForVHOfficer.and.returnValue(of(conferences));
        videoWebServiceSpy.getConferenceByIdVHO.and.returnValue(Promise.resolve(conferenceDetail));

        component = new CommandCentreComponent(videoWebServiceSpy, errorService, logger, router, screenHelper);
        component.conferences = hearings;
        screenHelper.enableFullScreen.calls.reset();
        videoWebServiceSpy.getConferenceByIdVHO.calls.reset();
    });

    it('should go fullscreen on init', fakeAsync(() => {
        component.loadingData = false;
        component.conferences = undefined;
        component.conferencesSubscription = undefined;

        component.ngOnInit();
        discardPeriodicTasks();

        expect(screenHelper.enableFullScreen).toHaveBeenCalledWith(true);
        expect(component.conferences.length).toBeGreaterThan(0);
        expect(component.conferencesSubscription).toBeDefined();
        expect(component.interval).toBeDefined();
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

    it('should setup interval to retrieve conference changes', () => {
        expect(component.interval).toBeUndefined();
        component.setupConferenceInterval();
        expect(component.interval).toBeDefined();
    });

    it('should return true when current conference is selected', () => {
        const currentConference = conferences[0];
        component.selectedHearing = new Hearing(new ConferenceResponse({ id: currentConference.id }));
        expect(component.isCurrentConference(currentConference)).toBeTruthy();
    });

    it('should handle api error when retrieving conference list fails', fakeAsync(() => {
        const error = { status: 404, isApiException: true };
        videoWebServiceSpy.getConferencesForVHOfficer.and.returnValue(throwError(error));
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

        expect(videoWebServiceSpy.getConferenceByIdVHO).toHaveBeenCalledWith(currentConference.id);
    });

    it('should not get conference details if already selected', () => {
        const currentConference = conferences[0];
        component.selectedHearing = new Hearing(new ConferenceResponse({ id: currentConference.id }));

        component.onConferenceSelected(currentConference);

        expect(videoWebServiceSpy.getConferenceByIdVHO).toHaveBeenCalledTimes(0);
    });

    it('should map hearing on conference retrieval', async () => {
        component.selectedHearing = null;
        const confId = conferences[0].id;
        await component.retrieveConferenceDetails(confId);

        expect(component.selectedHearing).toBeDefined();
    });

    it('should handle api error when retrieving conference details fails', fakeAsync(() => {
        const error = { status: 404, isApiException: true };
        videoWebServiceSpy.getConferenceByIdVHO.and.returnValue(throwError(error));
        errorService.handleApiError.and.callFake(() => {
            Promise.resolve(true);
        });
        tick();
        component.retrieveConferenceDetails(conferences[0].id);
        expect(errorService.handleApiError).toHaveBeenCalledWith(error);
    }));
});
