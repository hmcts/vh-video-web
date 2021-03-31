import { ErrorCameraMicrophoneComponent } from './error-camera-microphone.component';
import { PageTrackerService } from 'src/app/services/page-tracker.service';
import { Router } from '@angular/router';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { ErrorService } from 'src/app/services/error.service';

describe('ErrorComeraMicrophoneComponent', () => {
    let routerSpy: jasmine.SpyObj<Router>;
    let pageTrackerSpy: jasmine.SpyObj<PageTrackerService>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    pageTrackerSpy = jasmine.createSpyObj<PageTrackerService>(['trackPreviousPage', 'getPreviousUrl']);
    pageTrackerSpy.getPreviousUrl.and.returnValue('previous-page-url');
    errorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', ['getMediaDeviceErrorMessageTypeFromStorage']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    const component = new ErrorCameraMicrophoneComponent(routerSpy, pageTrackerSpy, new MockLogger(), errorServiceSpy);

    it('should display error message device in use', () => {
        errorServiceSpy.getMediaDeviceErrorMessageTypeFromStorage.and.returnValue('DevicesInUse');
        component.ngOnInit();
        expect(component.deviceIsInUse).toBe(true);
    });
    it('should display error message device not avaliable', () => {
        errorServiceSpy.getMediaDeviceErrorMessageTypeFromStorage.and.returnValue('DevicesNotFound');
        component.ngOnInit();
        expect(component.deviceIsInUse).toBe(false);
    });
    it('should navigate to previous page on continue', () => {
        component.continue();
        expect(pageTrackerSpy.getPreviousUrl).toHaveBeenCalledTimes(1);
        expect(routerSpy.navigate).toHaveBeenCalled();
    });
});
