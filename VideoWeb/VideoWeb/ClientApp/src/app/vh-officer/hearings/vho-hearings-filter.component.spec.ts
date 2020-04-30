import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { TestFixtureHelper } from 'src/app/testing/Helper/test-fixture-helper';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { VhoHearingsComponent } from './vho-hearings.component';

describe('VhoHearingsComponent Filter', () => {
    let component: VhoHearingsComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let eventsService: jasmine.SpyObj<EventsService>;
    let domSanitizerSpy: jasmine.SpyObj<DomSanitizer>;
    const logger: Logger = new MockLogger();
    const conferences = new ConferenceTestData().getTestDataForFilter();
    const filter = new ConferenceTestData().getHearingsFilter();
    const hearings = conferences.map(c => new HearingSummary(c));
    let errorService: jasmine.SpyObj<ErrorService>;
    let router: jasmine.SpyObj<Router>;

    beforeAll(() => {
        TestFixtureHelper.setupVenues();
        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferencesForVHOfficer']);
        domSanitizerSpy = jasmine.createSpyObj<DomSanitizer>('DomSanitizer', ['bypassSecurityTrustResourceUrl']);

        eventsService = jasmine.createSpyObj<EventsService>('EventsService', ['start']);

        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', [
            'goToServiceError',
            'handleApiError',
            'returnHomeIfUnauthorised'
        ]);
    });

    beforeEach(() => {
        component = new VhoHearingsComponent(videoWebServiceSpy, domSanitizerSpy, errorService, eventsService, logger, router);
        component.conferences = hearings;
        component.conferencesAll = conferences;
    });

    afterAll(() => {
        TestFixtureHelper.clearVenues();
    });

    it('should apply filter with selected all to conferences records', () => {
        expect(component.conferences.length).toBe(3);
        component.activateFilterOptions(filter);
        expect(component.conferences.length).toBe(3);
    });

    it('should apply filter with selected status and location to conferences records', () => {
        expect(component.conferences.length).toBe(3);
        filter.statuses[0].selected = true;
        component.activateFilterOptions(filter);
        expect(component.conferences.length).toBe(2);
        expect(component.conferences[0].status).toBe(filter.statuses[0].status);
        expect(component.conferences[1].status).toBe(filter.statuses[0].status);
    });

    it('should close monitoring graph for selected participant', () => {
        component.displayGraph = true;
        component.closeGraph(true);
        expect(component.displayGraph).toBe(false);
    });
});
