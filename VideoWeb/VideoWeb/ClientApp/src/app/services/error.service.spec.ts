import { Router } from '@angular/router';
import { Guid } from 'guid-typescript';
import { pageUrls } from '../shared/page-url.constants';
import { MockLogger } from '../testing/mocks/MockLogger';
import { CallError } from '../waiting-space/models/video-call-models';
import { ErrorService } from './error.service';
import { Logger } from './logging/logger-base';
import { SessionStorage } from './session-storage';
import { ErrorMessage } from '../shared/models/error-message';
import { MockProfileService } from '../testing/mocks/MockProfileService';

describe('ErrorService', () => {
    let component: ErrorService;
    let router: jasmine.SpyObj<Router>;
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const logger: Logger = new MockLogger();
    let profileService;
    const mockProfileService = new MockProfileService();
    profileService = mockProfileService;

    beforeEach(() => {
        component = new ErrorService(router, logger, profileService);
    });

    it('should do nothing if skip redirect is true', () => {
        const error = { status: 401, isApiException: true };
        component.handleApiError(error, true);
        expect(router.navigate).toHaveBeenCalledTimes(0);
    });

    it('should do nothing if error is not an api exception', () => {
        const error = { message: 'this is a standard error' };
        component.handleApiError(error);
        expect(router.navigate).toHaveBeenCalledTimes(0);
    });

    it('should navigate to unauthorised', () => {
        const error = { status: 401, isApiException: true };
        component.handleApiError(error);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.Unauthorised]);
    });

    it('should navigate to not found', () => {
        const error = { status: 404, isApiException: true };
        component.handleApiError(error);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.NotFound]);
    });

    it('should navigate to service error', () => {
        const error = { status: 500, isApiException: true };
        component.handleApiError(error);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.ServiceError]);
    });

    it('should return false when error not an ApiException during unauthorised check', () => {
        const error = { message: 'this is a standard error' };
        expect(component.returnHomeIfUnauthorised(error)).toBeFalsy();
    });

    it('should return false when error not a 401 ApiException during unauthorised check', () => {
        const error = { status: 500, isApiException: true };
        expect(component.returnHomeIfUnauthorised(error)).toBeFalsy();
    });

    it('should return true and navigate to home when error is a 401 ApiException during unauthorised check', () => {
        const error = { status: 401, isApiException: true };
        expect(component.returnHomeIfUnauthorised(error)).toBeTruthy();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.Home]);
    });

    it('should navigate to service error with connection lost message when pexip error message has connection related text', () => {
        spyOn(component, 'goToServiceError');
        spyOnProperty(component, 'hasInternetConnection').and.returnValue(true);
        const error = new CallError('Error connecting to conference');
        const conferenceId = Guid.create().toString();
        component.handlePexipError(error, conferenceId);
        expect(component.goToServiceError).toHaveBeenCalledWith('Your connection was lost');
    });

    it('should navigate to service error with connection lost message', () => {
        spyOn(component, 'goToServiceError');
        spyOnProperty(component, 'hasInternetConnection').and.returnValue(false);
        const error = new CallError('Error connecting to conference');
        const conferenceId = Guid.create().toString();
        component.handlePexipError(error, conferenceId);
        // tslint:disable-next-line: quotemark
        expect(component.goToServiceError).toHaveBeenCalledWith("There's a problem with your connection");
    });

    it('should navigate to service error with connection lost message when pexip error message has firewall or browser extensions issue', () => {
        spyOn(component, 'goToServiceError');
        const error = new CallError('Call failed: a firewall may be blocking access.');
        const conferenceId = Guid.create().toString();
        component.handlePexipError(error, conferenceId);
        expect(component.goToServiceError).toHaveBeenCalledWith('FirewallProblem');
    });

    it('should navigate to service error with media blocked message when pexip return a media related', () => {
        spyOn(component, 'goToServiceError');
        const error = new CallError(
            `Your camera and/or microphone are not available. Please make sure they are not being actively used by another app`
        );
        const conferenceId = Guid.create().toString();
        component.handlePexipError(error, conferenceId);
        expect(component.goToServiceError).toHaveBeenCalledWith(
            'Your camera and microphone are blocked',
            'Please unblock the camera and microphone or call us if there is a problem.',
            false
        );
    });

    it('should navigate to service error with default message when pexip error message is generic', () => {
        spyOn(component, 'goToServiceError');
        spyOnProperty(component, 'hasInternetConnection').and.returnValue(true);
        const error = new CallError('This meeting has reached the maximum number of participants.');
        const conferenceId = Guid.create().toString();
        component.handlePexipError(error, conferenceId);
        expect(component.goToServiceError).toHaveBeenCalledWith(
            'An unexpected error occurred',
            'Please click "Reconnect" to return to the previous page. Call us if you keep seeing this message.'
        );
    });

    it('should navigate to media device error with camera and microphone in use message when pexip return a media related error', () => {
        spyOn(component, 'goToMediaDeviceError');
        const error = new CallError(`NotReadableError`);
        const conferenceId = Guid.create().toString();
        component.handlePexipError(error, conferenceId);
        expect(component.goToMediaDeviceError).toHaveBeenCalledWith('DevicesInUse');
    });
    it('should navigate to media device error with camera and microphone not found message when pexip return a media related error', () => {
        spyOn(component, 'goToMediaDeviceError');
        const error = new CallError(`OverconstrainedError`);
        const conferenceId = Guid.create().toString();
        component.handlePexipError(error, conferenceId);
        expect(component.goToMediaDeviceError).toHaveBeenCalledWith('DevicesNotFound');
    });
    it('should get the error type message from storage for media devices', () => {
        const store = new SessionStorage<string>(component.ERROR_CAMERA_MIC_MESSAGE_KEY);
        const expected = 'MessageType-1';
        store.set(expected);
        const messageType = component.getMediaDeviceErrorMessageTypeFromStorage();
        expect(messageType).toBe(expected);
    });
    it('should navigate to error with camera and microphone not found message when pexip return preferred device is not connected', () => {
        spyOn(component, 'goToMediaDeviceError');
        const error = new CallError(`Preferred device is no longer connected`);
        const conferenceId = Guid.create().toString();
        component.handlePexipError(error, conferenceId);
        expect(component.goToMediaDeviceError).toHaveBeenCalledWith('DevicesNotFound');
    });
    it('should get the error type message from storage for firewall issue', () => {
        const store = new SessionStorage<ErrorMessage>(component.ERROR_MESSAGE_KEY);
        const expected = new ErrorMessage('Firewall', null, true);
        store.set(expected);
        const messageType = component.getErrorMessageFromStorage();
        expect(messageType.title).toEqual(expected.title);
    });
});
