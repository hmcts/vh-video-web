import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ErrorMessage } from '../shared/models/error-message';
import { pageUrls } from '../shared/page-url.constants';
import { CallError } from '../waiting-space/models/video-call-models';
import { ApiException } from './clients/api-client';
import { Logger } from './logging/logger-base';
import { SessionStorage } from './session-storage';
import { ConnectionStatusService } from './connection-status.service';
import { LocationService } from './location.service';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ErrorService {
    constructor(
        private router: Router,
        private logger: Logger,
        private connectionStatusService: ConnectionStatusService,
        private locationService: LocationService,
        private translateService: TranslateService
    ) {
        this.errorMessage = new SessionStorage<ErrorMessage>(this.ERROR_MESSAGE_KEY);
        this.errorCameraMicMessage = new SessionStorage<string>(this.ERROR_CAMERA_MIC_MESSAGE_KEY);
        this.connectionStatusService.onConnectionStatusChange().subscribe(online => {
            const currentPathName = this.locationService.getCurrentPathName();
            const isWaitingRoom = currentPathName.indexOf('waiting-room') > 0;
            if (!online && !isWaitingRoom) {
                return this.goToServiceError(
                    this.translateService.instant('error.problem-with-connection'),
                    this.translateService.instant('error.click-reconnect')
                );
            }
        });
    }
    readonly ERROR_MESSAGE_KEY = 'vh.error.message';
    readonly ERROR_CAMERA_MIC_MESSAGE_KEY = 'vh.error.camera.mic.message';

    errorMessage: SessionStorage<ErrorMessage>;
    errorCameraMicMessage: SessionStorage<string>;

    handleApiError(error: any, skipRedirect: boolean = false) {
        this.logger.error('[ErrorService] - API error', error);
        if (skipRedirect) {
            return;
        }
        if (!ApiException.isApiException(error)) {
            return;
        }
        const swaggerError: ApiException = error;
        switch (swaggerError.status) {
            case 401:
                return this.goToUnauthorised();
            case 404:
                return this.goToNotFound();
            default:
                return this.goToServiceError(
                    this.translateService.instant('error-service.unexpected-error'),
                    this.translateService.instant('error-service.click-reconnect')
                );
        }
    }

    returnHomeIfUnauthorised(error: any): boolean {
        if (!ApiException.isApiException(error)) {
            return false;
        }
        const swaggerError: ApiException = error;
        if (swaggerError.status === 401) {
            this.logger.warn('[ErrorService] - Unauthorised request. Returning back home.');
            this.router.navigate([pageUrls.Home]);
            return true;
        }
        return false;
    }

    goToUnauthorised() {
        this.logger.warn('[ErrorService] - Going to unauthorised page.');
        this.router.navigate([pageUrls.Unauthorised]);
    }

    goToNotFound() {
        this.logger.warn('[ErrorService] - Going to not found page.');
        this.router.navigate([pageUrls.NotFound]);
    }

    goToServiceError(title: string, body: string = null, showReconnect = true) {
        this.connectionStatusService.checkNow();
        this.saveToSession(title, body, showReconnect);
        this.router.navigate([pageUrls.ServiceError]);
    }

    goToMediaDeviceError(errorType: string) {
        this.saveDeviceToSession(errorType);
        this.router.navigate([pageUrls.ErrorCameraMicrophone]);
    }

    getMediaDeviceErrorMessageTypeFromStorage() {
        return this.errorCameraMicMessage.get();
    }

    getErrorMessageFromStorage() {
        return this.errorMessage.get();
    }

    handlePexipError(error: CallError, conferenceId: string) {
        this.logger.error('[ErrorService] - There was a pexip error', new Error(error.reason), {
            conference: conferenceId,
            error
        });
        const connectionErrors = [
            'Error connecting to',
            'There is no connection',
            'Call failed. Please try again',
            'Call failed: Failed to forward request',
            'The server cannot be reached',
            'Something went wrong',
            'could not be reached',
            'call could not be placed',
            'cannot connect to'
        ];
        const isConnectionError = connectionErrors.filter(x => error.reason.toLowerCase().includes(x.toLowerCase())).length > 0;
        if (isConnectionError) {
            this.goToServiceError(
                this.translateService.instant('error-service.problem-with-connection'),
                this.translateService.instant('error-service.click-reconnect')
            );
            return;
        }
        const mediaBlockingIssues = [
            'Your camera and/or microphone are not available',
            'Permission denied',
            'NotAllowedError',
            'PermissionDeniedError',
            'The request is not allowed by the user agent or the platform in the current context.'
        ];
        const mediaInUseIssues = ['Could not get access to camera/microphone', 'AbortError', 'NotReadableError', 'TrackStartError'];
        const mediaNotFoundIssues = [
            'OverconstrainedError',
            'NotFoundError',
            'TypeError',
            'DevicesNotFoundError',
            'ConstraintNotSatisfiedError',
            'Preferred device is no longer connected'
        ];

        const isMediaInUseIssue = mediaInUseIssues.filter(x => error.reason.toLowerCase().includes(x.toLowerCase())).length > 0;
        if (isMediaInUseIssue) {
            this.goToMediaDeviceError('DevicesInUse');
            return;
        }

        const isMediaNotFoundIssue = mediaNotFoundIssues.filter(x => error.reason.toLowerCase().includes(x.toLowerCase())).length > 0;
        if (isMediaNotFoundIssue) {
            this.goToMediaDeviceError('DevicesNotFound');
            return;
        }

        const isMediaBlockingIssue = mediaBlockingIssues.filter(x => error.reason.toLowerCase().includes(x.toLowerCase())).length > 0;
        if (isMediaBlockingIssue) {
            this.goToServiceError(
                this.translateService.instant('error-service.camera-mic-blocked'),
                this.translateService.instant('error-service.please-unblock'),
                false
            );
            return;
        }

        const extensionsOrFirewallIssues = [
            'a firewall may be blocking access',
            'Please disable any privacy extensions on your browser',
            'Failed to gather IP addresses'
        ];
        const isExtensionOrFirewallIssue =
            extensionsOrFirewallIssues.filter(x => error.reason.toLowerCase().includes(x.toLowerCase())).length > 0;
        if (isExtensionOrFirewallIssue) {
            this.goToServiceError('FirewallProblem');
            return;
        }

        return this.goToServiceError(
            this.translateService.instant('error-service.unexpected-error'),
            this.translateService.instant('error-service.click-reconnect')
        );
    }

    private saveToSession(title: string, body: string, showReconnect = true): void {
        this.errorMessage.clear();
        this.errorMessage.set(new ErrorMessage(title, body, showReconnect));
    }

    private saveDeviceToSession(message: string): void {
        this.errorCameraMicMessage.clear();
        this.errorCameraMicMessage.set(message);
    }
}
