import { convertToParamMap, Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { SelfTestComponent } from 'src/app/shared/self-test/self-test.component';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { IndependentSelfTestComponent } from './independent-self-test.component';

describe('IndependentSelfTestComponent', () => {
    let component: IndependentSelfTestComponent;
    let selfTestComponent: jasmine.SpyObj<SelfTestComponent>;
    const conference = new ConferenceTestData().getConferenceDetailFuture();

    let router: jasmine.SpyObj<Router>;
    const activatedRoute: any = { snapshot: { paramMap: convertToParamMap({ conferenceId: conference.id }) } };
    const logger: Logger = new MockLogger();
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    const mockAdalService = new MockAdalService();
    let adalService;
    let errorService: jasmine.SpyObj<ErrorService>;

    beforeAll(() => {
        selfTestComponent = jasmine.createSpyObj<SelfTestComponent>('SelfTestComponent', ['replayVideo']);
        adalService = mockAdalService;
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceById', 'getPexipConfig']);

        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', [
            'goToServiceError',
            'handleApiError',
            'returnHomeIfUnauthorised'
        ]);
    });

    beforeEach(() => {
        component = new IndependentSelfTestComponent(router, activatedRoute, videoWebService, errorService, adalService, logger);
        component.selfTestComponent = selfTestComponent;
    });

    it('should navigate to hearing list when equipment works', () => {
        component.equipmentWorksHandler();
        expect(router.navigateByUrl).toHaveBeenCalledWith(pageUrls.ParticipantHearingList);
    });

    it('should show equipment fault message when equipment fails', () => {
        component.equipmentFaultyHandler();
        expect(component.showEquipmentFaultMessage).toBeTruthy();
        expect(component.testInProgress).toBeFalsy();
        expect(component.hideSelfTest).toBeTruthy();
    });

    it('should show self test restarting video', () => {
        const selfTestSpy = jasmine.createSpyObj<SelfTestComponent>('SelfTestComponent', ['replayVideo']);
        selfTestSpy.replayVideo.and.callFake(() => {});
        component.selfTestComponent = selfTestSpy;

        component.restartTest();

        expect(component.showEquipmentFaultMessage).toBeFalsy();
        expect(component.testInProgress).toBeFalsy();
        expect(component.hideSelfTest).toBeFalsy();
        expect(selfTestSpy.replayVideo).toHaveBeenCalled();
    });
});
