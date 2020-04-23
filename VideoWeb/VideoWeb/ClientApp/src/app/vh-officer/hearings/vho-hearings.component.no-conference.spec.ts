import { fakeAsync, tick } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { throwError } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { VhoHearingsComponent } from './vho-hearings.component';
import { Router } from '@angular/router';

describe('VhoHearingsComponent when conference retrieval fails', () => {
    let component: VhoHearingsComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let eventsService: jasmine.SpyObj<EventsService>;
    let domSanitizerSpy: jasmine.SpyObj<DomSanitizer>;
    const logger: Logger = new MockLogger();
    let errorService: jasmine.SpyObj<ErrorService>;

    let router: jasmine.SpyObj<Router>;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferencesForVHOfficer']);
        domSanitizerSpy = jasmine.createSpyObj<DomSanitizer>('DomSanitizer', ['bypassSecurityTrustResourceUrl']);
        eventsService = jasmine.createSpyObj<EventsService>('EventsService', ['start']);
        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', ['handleApiError']);
    });

    beforeEach(() => {
        component = new VhoHearingsComponent(videoWebServiceSpy, domSanitizerSpy, errorService, eventsService, logger, router);
        component.conferences = null;
        component.conferencesAll = null;
        component.selectedHearing = null;
    });

    it('should handle api error when retrieving conference fails', fakeAsync(() => {
        videoWebServiceSpy.getConferencesForVHOfficer.and.returnValue(throwError({ status: 404, isApiException: true }));
        errorService.handleApiError.and.callFake(() => {
            Promise.resolve(true);
        });
        tick();
        component.retrieveHearingsForVhOfficer();
        expect(errorService.handleApiError).toHaveBeenCalledTimes(1);
    }));
});
