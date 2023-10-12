import { convertToParamMap, Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceLite } from 'src/app/services/models/conference-lite';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { IntroductionComponent } from './introduction.component';
import { of } from 'rxjs';

describe('IntroductionComponent', () => {
    let component: IntroductionComponent;

    const conference = new ConferenceTestData().getConferenceDetailNow();
    const confLite = new ConferenceLite(conference.id, conference.case_number);

    let router: jasmine.SpyObj<Router>;
    const activatedRoute: any = { snapshot: { paramMap: convertToParamMap({ conferenceId: conference.id }) } };
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;

    const participantStatusUpdateService = jasmine.createSpyObj('ParticipantStatusUpdateService', ['postParticipantStatus']);

    beforeAll(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getActiveIndividualConference',
            'checkUserHasCompletedSelfTest'
        ]);

        videoWebServiceSpy.getActiveIndividualConference.and.returnValue(confLite);
        videoWebServiceSpy.checkUserHasCompletedSelfTest.and.returnValue(of(false));
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    });

    beforeEach(() => {
        component = new IntroductionComponent(router, activatedRoute, videoWebServiceSpy, participantStatusUpdateService, new MockLogger());
        router.navigate.calls.reset();
        component.ngOnInit();
    });

    it('should define conferece id on init', () => {
        component.conferenceId = null;
        component.ngOnInit();
        expect(component.conferenceId).toBe(conference.id);
    });

    it('should navigate to equipment check', () => {
        component.goToEquipmentCheck();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.EquipmentCheck, conference.id]);
    });

    it('should navigate to hearing rules', () => {
        component.skipToCourtRulesPage();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.HearingRules, conference.id]);
    });
});
