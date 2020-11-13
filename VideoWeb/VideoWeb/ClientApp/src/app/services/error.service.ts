import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ErrorMessage } from '../shared/models/error-message';
import { pageUrls } from '../shared/page-url.constants';
import { CallError } from '../waiting-space/models/video-call-models';
import { ApiException } from './clients/api-client';
import { Logger } from './logging/logger-base';
import { SessionStorage } from './session-storage';

@Injectable({
    providedIn: 'root'
})
export class ErrorService {
    constructor(private router: Router, private logger: Logger) {
        this.errorMessage = new SessionStorage<ErrorMessage>(this.ERROR_MESSAGE_KEY);
    }
    readonly ERROR_MESSAGE_KEY = 'vh.error.message';
    errorMessage: SessionStorage<ErrorMessage>;

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
                    this.hasInternetConnection ? 'An unexpected error occurred.' : 'Your connection was lost',
                    'Please click "Reconnect" to return to the previous page. Call us if you keep seeing this message.'
                );
        }
    }

    get hasInternetConnection(): boolean {
        return window.navigator.onLine;
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
        this.saveToSession(title, body, showReconnect);
        this.router.navigate([pageUrls.ServiceError]);
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
            this.goToServiceError('Your connection was lost');
            return;
        }
        const mediaBlockingIssues = ['Your camera and/or microphone are not available'];
        const isMediaBlockingIssue = mediaBlockingIssues.filter(x => error.reason.toLowerCase().includes(x.toLowerCase())).length > 0;
        if (isMediaBlockingIssue) {
            this.goToServiceError(
                'Your camera and microphone are blocked',
                'Please unblock the camera and microphone or call us if there is a problem.',
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
            this.goToServiceError(
                'Your connection was lost',
                'Please check your firewall settings and disable any privacy extensions that may block connections.'
            );
            return;
        }

        return this.goToServiceError(
            this.hasInternetConnection ? 'An unexpected error occurred' : 'Your connection was lost',
            'Please click "Reconnect" to return to the previous page. Call us if you keep seeing this message.'
        );
    }

    private saveToSession(title: string, body: string, showReconnect = true): void {
        this.errorMessage.clear();
        this.errorMessage.set(new ErrorMessage(title, body, showReconnect));
    }
}
