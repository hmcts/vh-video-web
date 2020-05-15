import { fakeAsync, tick } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { VhoQueryService } from 'src/app/vh-officer/services/vho-query-service.service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { VhoHearingsComponent } from './vho-hearings.component';

describe('VhoHearingsComponent when conference retrieval fails', () => {
    let component: VhoHearingsComponent;
    let vhoQueryService: jasmine.SpyObj<VhoQueryService>;
    let eventsService: jasmine.SpyObj<EventsService>;
    let domSanitizerSpy: jasmine.SpyObj<DomSanitizer>;
    const logger: Logger = new MockLogger();
    let errorService: jasmine.SpyObj<ErrorService>;

    let router: jasmine.SpyObj<Router>;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
        vhoQueryService = jasmine.createSpyObj<VhoQueryService>('VhoQueryService', ['getConferencesForVHOfficer']);
        domSanitizerSpy = jasmine.createSpyObj<DomSanitizer>('DomSanitizer', ['bypassSecurityTrustResourceUrl']);
        eventsService = jasmine.createSpyObj<EventsService>('EventsService', ['start']);
        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', ['handleApiError']);
    });

    beforeEach(() => {
        component = new VhoHearingsComponent(vhoQueryService, domSanitizerSpy, errorService, eventsService, logger, router);
        component.conferences = null;
        component.conferencesAll = null;
        component.selectedHearing = null;
    });

    it('should handle api error when retrieving conference fails', fakeAsync(() => {
        vhoQueryService.getConferencesForVHOfficer.and.returnValue(throwError({ status: 404, isApiException: true }));
        errorService.handleApiError.and.callFake(() => {
            Promise.resolve(true);
        });
        tick();
        component.retrieveHearingsForVhOfficer(true);
        expect(errorService.handleApiError).toHaveBeenCalledTimes(1);
    }));
});
