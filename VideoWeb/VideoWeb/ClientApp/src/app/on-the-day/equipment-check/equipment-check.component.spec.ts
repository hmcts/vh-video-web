import { convertToParamMap, Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { EquipmentCheckComponent } from './equipment-check.component';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';

describe('EquipmentCheckComponent', () => {
    let component: EquipmentCheckComponent;
    const conference = new ConferenceTestData().getConferenceDetailNow();

    let router: jasmine.SpyObj<Router>;
    const activatedRoute: any = { snapshot: { paramMap: convertToParamMap({ conferenceId: conference.id }) } };

    let participantStatusUpdateService: jasmine.SpyObj<ParticipantStatusUpdateService>;
    participantStatusUpdateService = jasmine.createSpyObj('ParticipantStatusUpdateService', ['postParticipantStatus']);

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    });

    beforeEach(() => {
        component = new EquipmentCheckComponent(router, activatedRoute, participantStatusUpdateService, new MockLogger());
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
