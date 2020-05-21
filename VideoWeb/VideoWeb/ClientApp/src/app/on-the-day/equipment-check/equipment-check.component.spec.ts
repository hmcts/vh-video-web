import { convertToParamMap, Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { EquipmentCheckComponent } from './equipment-check.component';

describe('EquipmentCheckComponent', () => {
    let component: EquipmentCheckComponent;
    const conference = new ConferenceTestData().getConferenceDetailNow();

    let router: jasmine.SpyObj<Router>;
    const activatedRoute: any = { snapshot: { paramMap: convertToParamMap({ conferenceId: conference.id }) } };

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    });

    beforeEach(() => {
        component = new EquipmentCheckComponent(router, activatedRoute);
        router.navigate.calls.reset();
        component.ngOnInit();
    });

    it('should navigate to camera-and-microphone with conference id', () => {
        component.goToCameraAndMicCheck();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.SwitchOnCameraMicrophone, conference.id]);
    });

    it('should navigate to camera-and-microphone without conference id', () => {
        component.conferenceId = null;
        component.goToCameraAndMicCheck();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.SwitchOnCameraMicrophone]);
    });
});
