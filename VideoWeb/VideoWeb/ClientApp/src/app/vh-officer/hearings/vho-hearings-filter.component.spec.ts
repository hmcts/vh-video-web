import { DomSanitizer } from '@angular/platform-browser';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
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
    const hearings = conferences.map((c) => new HearingSummary(c));
    let errorService: jasmine.SpyObj<ErrorService>;

    beforeAll(() => {
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
        component = new VhoHearingsComponent(videoWebServiceSpy, domSanitizerSpy, errorService, eventsService, logger);
        component.conferences = hearings;
        component.conferencesAll = conferences;
    });

    it('should apply filter with selected all to conferences records', () => {
        expect(component.conferences.length).toBe(3);
        component.activateFilterOptions(filter);
        expect(component.conferences.length).toBe(3);
    });

    it('should apply filter with selected status and location to conferences records', () => {
        expect(component.conferences.length).toBe(3);
        filter.locations[1].Selected = true;
        filter.statuses[0].Selected = true;
        component.activateFilterOptions(filter);
        expect(component.conferences.length).toBe(2);
        expect(component.conferences[0].hearingVenueName).toBe(filter.locations[1].Description);
        expect(component.conferences[1].hearingVenueName).toBe(filter.locations[1].Description);
        expect(component.conferences[0].status).toBe(filter.statuses[0].Status);
        expect(component.conferences[1].status).toBe(filter.statuses[0].Status);
    });

    it('should apply filter with selected alerts records', () => {
        expect(component.conferences.length).toBe(3);
        filter.locations.forEach((x) => (x.Selected = false));
        filter.statuses.forEach((x) => (x.Selected = false));
        filter.alerts[1].Selected = true;
        const expectedAlerts1 = filter.alerts[1].BodyText;
        component.activateFilterOptions(filter);

        expect(component.conferences.length).toBe(2);
        const filtered1 = component.conferences[0].tasks.filter((x) => x.body.includes(expectedAlerts1)).length > 0;
        expect(filtered1).toBe(true);
        const filtered2 = component.conferences[1].tasks.filter((x) => x.body.includes(expectedAlerts1)).length > 0;
        expect(filtered2).toBe(true);
    });
    it('should close monitoring graph for selected participant', () => {
        component.displayGraph = true;
        component.closeGraph(true);
        expect(component.displayGraph).toBe(false);
    });
});
