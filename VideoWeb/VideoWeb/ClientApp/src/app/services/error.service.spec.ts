import { Router } from '@angular/router';
import { Guid } from 'guid-typescript';
import { pageUrls } from '../shared/page-url.constants';
import { MockLogger } from '../testing/mocks/mock-logger';
import { CallError } from '../waiting-space/models/video-call-models';
import { ErrorService } from './error.service';
import { Logger } from './logging/logger-base';
import { SessionStorage } from './session-storage';
import { ErrorMessage } from '../shared/models/error-message';
import { ConnectionStatusService } from './connection-status.service';
import { connectionStatusServiceSpyFactory } from '../testing/mocks/mock-connection-status.service';
import { LocationService } from './location.service';
import { Observable, of } from 'rxjs';
import { translateServiceSpy } from '../testing/mocks/mock-translation.service';
import { Subject } from 'rxjs';

describe('ErrorService', () => {
    const mockLogger: Logger = new MockLogger();
    let routerSpy: jasmine.SpyObj<Router>;
    let connectionStatusServiceSpy: jasmine.SpyObj<ConnectionStatusService>;
    let localtionServiceSpy: jasmine.SpyObj<LocationService>;
    let service: ErrorService;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        connectionStatusServiceSpy = connectionStatusServiceSpyFactory();
        localtionServiceSpy = jasmine.createSpyObj('LocationService', ['getCurrentPathName']);
        localtionServiceSpy.getCurrentPathName.and.returnValue(`/${pageUrls.Declaration}`);
    });

    // ---------------------
    // --> private functions
    // ---------------------

    function setupRouterToReturn(navigationSucces: boolean) {
        routerSpy.navigate.and.returnValue(Promise.resolve(navigationSucces));
    }

    function createService() {
        service = new ErrorService(routerSpy, mockLogger, connectionStatusServiceSpy, localtionServiceSpy, translateServiceSpy);
    }

    // ---------------------
    // <-- private functions
    // ---------------------

    it('should create service without error', () => {
        createService();
        expect(service).toBeTruthy();
    });

    it('should do nothing if skip redirect is true', () => {
        // arrange
        createService();
        setupRouterToReturn(true);
        const error = { status: 401, isApiException: true };

        // act
        service.handleApiError(error, true);

        // assert
        expect(routerSpy.navigate).toHaveBeenCalledTimes(0);
    });

    it('should do nothing if error is not an api exception', () => {
        // arrange
        createService();
        setupRouterToReturn(true);
        const error = { message: 'this is a standard error' };

        // act
        service.handleApiError(error);

        // assert
        expect(routerSpy.navigate).toHaveBeenCalledTimes(0);
    });

    it('should navigate to unauthorised', () => {
        // arrange
        createService();
        setupRouterToReturn(true);
        const error = { status: 401, isApiException: true };

        // act
        service.handleApiError(error);

        // assert
        expect(routerSpy.navigate).toHaveBeenCalledWith([pageUrls.Unauthorised]);
    });

    it('should navigate to not found', () => {
        // arrange
        createService();
        setupRouterToReturn(true);
        const error = { status: 404, isApiException: true };

        // act
        service.handleApiError(error);

        // arrange
        expect(routerSpy.navigate).toHaveBeenCalledWith([pageUrls.NotFound]);
    });

    it('should navigate to service error', () => {
        // arrange
        createService();
        setupRouterToReturn(true);
        const error = { status: 500, isApiException: true };

        // act
        service.handleApiError(error);

        // arrange
        expect(routerSpy.navigate).toHaveBeenCalledWith([pageUrls.ServiceError]);
    });

    it('should return false when error not an ApiException during unauthorised check', () => {
        // arrange
        createService();
        const error = { message: 'this is a standard error' };

        // act
        const result = service.returnHomeIfUnauthorised(error);

        // assert
        expect(result).toBeFalsy();
    });

    it('should return false when error not a 401 ApiException during unauthorised check', () => {
        // arrange
        createService();
        const error = { status: 500, isApiException: true };

        // act
        const result = service.returnHomeIfUnauthorised(error);

        // assert
        expect(result).toBeFalsy();
    });

    it('should return true and navigate to home when error is a 401 ApiException during unauthorised check', () => {
        // arrange
        createService();
        setupRouterToReturn(true);
        const error = { status: 401, isApiException: true };

        // act
        const result = service.returnHomeIfUnauthorised(error);

        // assert
        expect(result).toBeTruthy();
        expect(routerSpy.navigate).toHaveBeenCalledWith([pageUrls.Home]);
    });

    it('should navigate to service error with connection lost message when pexip error message has connection related text', () => {
        // arrange
        createService();
        spyOn(service, 'goToServiceError');
        const error = new CallError('Error connecting to conference');
        const conferenceId = Guid.create().toString();
        translateServiceSpy.instant.calls.reset();
        const text1 = 'error-service.problem-with-connection';
        const text2 = 'error-service.click-reconnect';
        // act
        service.handlePexipError(error, conferenceId);

        // assert
        expect(service.goToServiceError).toHaveBeenCalledWith(text1, text2);
    });

    it('should navigate to service error with connection lost message when pexip error message has firewall or browser extensions issue', () => {
        // arrange
        createService();
        spyOn(service, 'goToServiceError');
        const error = new CallError('Call failed: a firewall may be blocking access.');
        const conferenceId = Guid.create().toString();

        // act
        service.handlePexipError(error, conferenceId);

        // assert
        expect(service.goToServiceError).toHaveBeenCalledWith('FirewallProblem');
    });

    it('should navigate to service error with media blocked message when pexip return a media related', () => {
        // arrange
        createService();
        spyOn(service, 'goToServiceError');
        const error = new CallError(
            `Your camera and/or microphone are not available. Please make sure they are not being actively used by another app`
        );
        const conferenceId = Guid.create().toString();
        const text1 = 'error-service.camera-mic-blocked';
        const text2 = 'error-service.please-unblock';
        translateServiceSpy.instant.calls.reset();

        // act
        service.handlePexipError(error, conferenceId);

        // assert
        expect(service.goToServiceError).toHaveBeenCalledWith(text1, text2, false);
    });

    it('should navigate to service error with default message when pexip error message is generic', () => {
        // arrange
        createService();
        spyOn(service, 'goToServiceError');
        const error = new CallError('This meeting has reached the maximum number of participants.');
        const conferenceId = Guid.create().toString();
        const text1 = 'error-service.unexpected-error';
        const text2 = 'error-service.click-reconnect';
        translateServiceSpy.instant.calls.reset();

        // act
        service.handlePexipError(error, conferenceId);

        // assert
        expect(service.goToServiceError).toHaveBeenCalledWith(text1, text2);
    });

    it('should navigate to media device error with camera and microphone in use message when pexip return a media related error', () => {
        // arrange
        createService();
        spyOn(service, 'goToMediaDeviceError');
        const error = new CallError(`NotReadableError`);
        const conferenceId = Guid.create().toString();

        // act
        service.handlePexipError(error, conferenceId);

        // assert
        expect(service.goToMediaDeviceError).toHaveBeenCalledWith('DevicesInUse');
    });

    it('should navigate to media device error with camera and microphone not found message when pexip return a media related error', () => {
        // arrange
        createService();
        spyOn(service, 'goToMediaDeviceError');
        const error = new CallError(`OverconstrainedError`);
        const conferenceId = Guid.create().toString();

        // act
        service.handlePexipError(error, conferenceId);

        // assert
        expect(service.goToMediaDeviceError).toHaveBeenCalledWith('DevicesNotFound');
    });

    it('should get the error type message from storage for media devices', () => {
        // arrange
        createService();
        const store = new SessionStorage<string>(service.ERROR_CAMERA_MIC_MESSAGE_KEY);
        const expected = 'MessageType-1';
        store.set(expected);

        // act
        const messageType = service.getMediaDeviceErrorMessageTypeFromStorage();

        // assert
        expect(messageType).toBe(expected);
    });

    it('should navigate to error with camera and microphone not found message when pexip return preferred device is not connected', () => {
        // arrange
        createService();
        spyOn(service, 'goToMediaDeviceError');
        const error = new CallError(`Preferred device is no longer connected`);
        const conferenceId = Guid.create().toString();
        // act
        service.handlePexipError(error, conferenceId);

        // assert
        expect(service.goToMediaDeviceError).toHaveBeenCalledWith('DevicesNotFound');
    });

    it('should get the error type message from storage for firewall issue', () => {
        // arrange
        createService();
        const store = new SessionStorage<ErrorMessage>(service.ERROR_MESSAGE_KEY);
        const expected = new ErrorMessage('Firewall', null, true);
        store.set(expected);
        // act
        const messageType = service.getErrorMessageFromStorage();

        // assert
        expect(messageType.title).toEqual(expected.title);
    });

    it('should navigate to service error on non-waiting room due to internet connection loss', () => {
        // arrange
        connectionStatusServiceSpy = jasmine.createSpyObj('ConnectionStatusService', ['onConnectionStatusChange', 'checkNow']);
        connectionStatusServiceSpy.onConnectionStatusChange.and.returnValue(of(false));
        localtionServiceSpy.getCurrentPathName.and.returnValue(`/${pageUrls.Declaration}`);

        // act
        createService();
        setupRouterToReturn(true);

        // assert
        expect(routerSpy.navigate).toHaveBeenCalledTimes(1);
    });

    it('should not navigate to service error on waiting room due to internet connection loss', () => {
        // arrange
        connectionStatusServiceSpy = jasmine.createSpyObj('ConnectionStatusService', ['onConnectionStatusChange']);
        connectionStatusServiceSpy.onConnectionStatusChange.and.returnValue(of(false));
        localtionServiceSpy.getCurrentPathName.and.returnValue(`/${pageUrls.ParticipantWaitingRoom}`);

        // act
        createService();
        setupRouterToReturn(true);

        spyOn(service, 'goToServiceError');

        // assert
        expect(routerSpy.navigate).toHaveBeenCalledTimes(0);
    });
});
