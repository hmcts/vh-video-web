import { convertToParamMap, Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceLite } from 'src/app/services/models/conference-lite';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { IntroductionComponent } from './introduction.component';

describe('IntroductionComponent', () => {
    let component: IntroductionComponent;

    const conference = new ConferenceTestData().getConferenceDetailNow();
    const confLite = new ConferenceLite(conference.id, conference.case_number);

    let router: jasmine.SpyObj<Router>;
    const activatedRoute: any = { snapshot: { paramMap: convertToParamMap({ conferenceId: conference.id }) } };
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;

    beforeAll(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getActiveIndividualConference']);

        videoWebServiceSpy.getActiveIndividualConference.and.returnValue(confLite);
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    });

    beforeEach(async () => {
        component = new IntroductionComponent(router, activatedRoute, videoWebServiceSpy);
        router.navigate.calls.reset();
        await component.ngOnInit();
    });

    it('should define conferece id on init', async () => {
        component.conferenceId = null;
        await component.ngOnInit();
        expect(component.conferenceId).toBe(conference.id);
    });
    it('should navigate to equipment check', () => {
        component.goToEquipmentCheck();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.EquipmentCheck, conference.id]);
    });
});
