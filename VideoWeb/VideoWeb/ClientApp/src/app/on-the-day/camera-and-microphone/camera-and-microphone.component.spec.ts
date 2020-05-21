import { convertToParamMap, Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { CameraAndMicrophoneComponent } from './camera-and-microphone.component';

describe('CameraAndMicrophoneComponent', () => {
    let component: CameraAndMicrophoneComponent;
    const conference = new ConferenceTestData().getConferenceDetailFuture();

    let router: jasmine.SpyObj<Router>;
    const activatedRoute: any = { snapshot: { paramMap: convertToParamMap({ conferenceId: conference.id }) } };

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
    });

    beforeEach(() => {
        component = new CameraAndMicrophoneComponent(router, activatedRoute);
        component.conferenceId = conference.id;
    });

    it('should retrieve conference id on init', () => {
        component.conferenceId = null;
        component.ngOnInit();
        expect(component.conferenceId).toBe(conference.id);
    });

    it('should navigate to hearing rules', () => {
        component.goToHearingRules();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.HearingRules, conference.id]);
    });
});
