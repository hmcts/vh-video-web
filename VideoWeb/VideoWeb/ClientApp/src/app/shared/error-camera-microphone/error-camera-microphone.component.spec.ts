import { ErrorCameraMicrophoneComponent } from './error-camera-microphone.component';
import { PageTrackerService } from 'src/app/services/page-tracker.service';
import { Router } from '@angular/router';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { SessionStorage } from 'src/app/services/session-storage';

describe('ErrorComeraMicrophoneComponent', () => {
    let routerSpy: jasmine.SpyObj<Router>;
    let pageTrackerSpy: jasmine.SpyObj<PageTrackerService>;
    pageTrackerSpy = jasmine.createSpyObj<PageTrackerService>(['trackPreviousPage', 'getPreviousUrl']);
    pageTrackerSpy.getPreviousUrl.and.returnValue('previous-page-url');

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const key = 'vh.error.camera.mic.message';
    const storedMessage = new SessionStorage<string>(key);

    const component = new ErrorCameraMicrophoneComponent(routerSpy, pageTrackerSpy, new MockLogger());

    it('should display error message device in use', () => {
        storedMessage.set('DevicesInUse');
        component.ngOnInit();
        expect(component.deviceIsInUse).toBe(true);
    });
    it('should display error message device not avaliable', () => {
        storedMessage.set('DevicesNotFound');
        component.ngOnInit();
        expect(component.deviceIsInUse).toBe(false);
    });
    it('should navigate to previous page on continue', () => {
        component.continue();
        expect(pageTrackerSpy.getPreviousUrl).toHaveBeenCalledTimes(1);
        expect(routerSpy.navigate).toHaveBeenCalled();
    });
});
