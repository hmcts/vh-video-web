import { convertToParamMap, Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceLite } from 'src/app/services/models/conference-lite';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { IntroductionComponent } from './introduction.component';
import { EventType, UpdateParticipantStatusEventRequest } from 'src/app/services/clients/api-client';

describe('IntroductionComponent', () => {
    let component: IntroductionComponent;

    const conference = new ConferenceTestData().getConferenceDetailNow();
    const confLite = new ConferenceLite(conference.id, conference.case_number);

    let router: jasmine.SpyObj<Router>;
    const activatedRoute: any = { snapshot: { paramMap: convertToParamMap({ conferenceId: conference.id }) } };
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let errorService: jasmine.SpyObj<ErrorService>;
    const logger: Logger = new MockLogger();

    beforeAll(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getActiveIndividualConference',
            'raiseParticipantEvent'
        ]);

        videoWebServiceSpy.getActiveIndividualConference.and.returnValue(confLite);
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);

        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', [
            'goToServiceError',
            'handleApiError',
            'returnHomeIfUnauthorised'
        ]);
    });

    beforeEach(async () => {
        component = new IntroductionComponent(router, activatedRoute, videoWebServiceSpy, errorService, logger);
        router.navigate.calls.reset();
        videoWebServiceSpy.raiseParticipantEvent.calls.reset();
        await component.ngOnInit();
    });

    it('should define conferece id on init', async () => {
        component.conferenceId = null;
        const expectedRequest = new UpdateParticipantStatusEventRequest({
            event_type: EventType.ParticipantJoining
        });
        await component.ngOnInit();
        expect(component.conferenceId).toBe(conference.id);
        expect(videoWebServiceSpy.raiseParticipantEvent).toHaveBeenCalledWith(confLite.id, expectedRequest);
    });

    it('should handle error when get conference throws error', async () => {
        const error = { error: 'unable to reach api' };
        videoWebServiceSpy.raiseParticipantEvent.and.callFake(() => Promise.reject(error));

        await component.getConference();

        expect(errorService.handleApiError).toHaveBeenCalledWith(error);
    });

    it('should navigate to equipment check', () => {
        component.goToEquipmentCheck();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.EquipmentCheck, conference.id]);
    });
});
