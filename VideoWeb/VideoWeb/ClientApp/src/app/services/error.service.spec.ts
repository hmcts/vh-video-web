import { inject, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Guid } from 'guid-typescript';
import { pageUrls } from '../shared/page-url.constants';
import { MockLogger } from '../testing/mocks/MockLogger';
import { CallError } from '../waiting-space/models/video-call-models';
import { HealthCheckService } from './api/healthcheck.service';
import { ErrorService } from './error.service';
import { Logger } from './logging/logger-base';
import { SessionStorage } from './session-storage';

describe('ErrorService', () => {
    let router: Router;
    let healthCheckService: jasmine.SpyObj<HealthCheckService>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            providers: [
                ErrorService,
                { provide: Logger, useClass: MockLogger },
                { provide: HealthCheckService, useValue: healthCheckService }
            ]
        });

        router = TestBed.inject(Router);

        healthCheckService = jasmine.createSpyObj<HealthCheckService>('HealthCheckService', ['getHealthCheckStatus']);
        healthCheckService.getHealthCheckStatus.and.returnValue(Promise.resolve(true));
    });

    it('should do nothing if skip redirect is true', inject([ErrorService], (service: ErrorService) => {
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
        const error = { status: 401, isApiException: true };

        service.handleApiError(error, true);

        expect(router.navigate).toHaveBeenCalledTimes(0);
    }));

    it('should do nothing if error is not an api exception', inject([ErrorService], (service: ErrorService) => {
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
        const error = { message: 'this is a standard error' };

        service.handleApiError(error);

        expect(router.navigate).toHaveBeenCalledTimes(0);
    }));

    it('should navigate to unauthorised', inject([ErrorService], (service: ErrorService) => {
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
        const error = { status: 401, isApiException: true };
        service.handleApiError(error);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.Unauthorised]);
    }));

    it('should navigate to not found', inject([ErrorService], (service: ErrorService) => {
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
        const error = { status: 404, isApiException: true };
        service.handleApiError(error);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.NotFound]);
    }));

    it('should navigate to service error', inject([ErrorService], (service: ErrorService) => {
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
        const error = { status: 500, isApiException: true };
        service.handleApiError(error);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.ServiceError]);
    }));

    it('should return false when error not an ApiException during unauthorised check', inject([ErrorService], (service: ErrorService) => {
        const error = { message: 'this is a standard error' };
        expect(service.returnHomeIfUnauthorised(error)).toBeFalsy();
    }));

    it('should return false when error not a 401 ApiException during unauthorised check', inject(
        [ErrorService],
        (service: ErrorService) => {
            const error = { status: 500, isApiException: true };
            expect(service.returnHomeIfUnauthorised(error)).toBeFalsy();
        }
    ));

    it('should return true and navigate to home when error is a 401 ApiException during unauthorised check', inject(
        [ErrorService],
        (service: ErrorService) => {
            spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
            const error = { status: 401, isApiException: true };
            expect(service.returnHomeIfUnauthorised(error)).toBeTruthy();
            expect(router.navigate).toHaveBeenCalledWith([pageUrls.Home]);
        }
    ));

    it('should navigate to service error with connection lost message when pexip error message has connection related text', inject(
        [ErrorService],
        (service: ErrorService) => {
            spyOn(service, 'goToServiceError');
            spyOnProperty(service, 'hasInternetConnection').and.returnValue(true);
            const error = new CallError('Error connecting to conference');
            const conferenceId = Guid.create().toString();
            service.handlePexipError(error, conferenceId);
            expect(service.goToServiceError).toHaveBeenCalledWith('Your connection was lost');
        }
    ));

    it('should navigate to service error with connection lost message', inject([ErrorService], (service: ErrorService) => {
        spyOn(service, 'goToServiceError');
        spyOnProperty(service, 'hasInternetConnection').and.returnValue(false);
        const error = new CallError('Error connecting to conference');
        const conferenceId = Guid.create().toString();
        service.handlePexipError(error, conferenceId);
        // tslint:disable-next-line: quotemark
        expect(service.goToServiceError).toHaveBeenCalledWith("There's a problem with your connection");
    }));

    it('should navigate to service error with connection lost message when pexip error message has firewall or browser extensions issue', inject(
        [ErrorService],
        (service: ErrorService) => {
            spyOn(service, 'goToServiceError');
            const error = new CallError('Call failed: a firewall may be blocking access.');
            const conferenceId = Guid.create().toString();
            service.handlePexipError(error, conferenceId);
            expect(service.goToServiceError).toHaveBeenCalledWith(
                'Your connection was lost',
                'Please check your firewall settings and disable any privacy extensions that may block connections.'
            );
        }
    ));

    it('should navigate to service error with media blocked message when pexip return a media related', inject(
        [ErrorService],
        (service: ErrorService) => {
            spyOn(service, 'goToServiceError');
            const error = new CallError(
                `Your camera and/or microphone are not available. Please make sure they are not being actively used by another app`
            );
            const conferenceId = Guid.create().toString();
            service.handlePexipError(error, conferenceId);
            expect(service.goToServiceError).toHaveBeenCalledWith(
                'Your camera and microphone are blocked',
                'Please unblock the camera and microphone or call us if there is a problem.',
                false
            );
        }
    ));

    it('should navigate to service error with default message when pexip error message is generic', inject(
        [ErrorService],
        (service: ErrorService) => {
            spyOn(service, 'goToServiceError');
            spyOnProperty(service, 'hasInternetConnection').and.returnValue(true);
            const error = new CallError('This meeting has reached the maximum number of participants.');
            const conferenceId = Guid.create().toString();
            service.handlePexipError(error, conferenceId);
            expect(service.goToServiceError).toHaveBeenCalledWith(
                'An unexpected error occurred',
                'Please click "Reconnect" to return to the previous page. Call us if you keep seeing this message.'
            );
        }
    ));
    it('should navigate to media device error with camera and microphone in use message when pexip return a media related error', inject(
        [ErrorService],
        (service: ErrorService) => {
            spyOn(service, 'goToMediaDeviceError');
            const error = new CallError(`NotReadableError`);
            const conferenceId = Guid.create().toString();
            service.handlePexipError(error, conferenceId);
            expect(service.goToMediaDeviceError).toHaveBeenCalledWith('DevicesInUse');
        }
    ));
    it('should navigate to media device error with camera and microphone not found message when pexip return a media related error', inject(
        [ErrorService],
        (service: ErrorService) => {
            spyOn(service, 'goToMediaDeviceError');
            const error = new CallError(`OverconstrainedError`);
            const conferenceId = Guid.create().toString();
            service.handlePexipError(error, conferenceId);
            expect(service.goToMediaDeviceError).toHaveBeenCalledWith('DevicesNotFound');
        }
    ));
    it('should get the error type message from storage for media devices', inject([ErrorService], (service: ErrorService) => {
        const store = new SessionStorage<string>(service.ERROR_CAMERA_MIC_MESSAGE_KEY);
        const expected = 'MessageType-1';
        store.set(expected);
        const messageType = service.getMediaDeviceErrorMessageTypeFromStorage();
        expect(messageType).toBe(expected);
    }));
});
