import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ErrorMessage } from '../shared/models/error-message';
import { pageUrls } from '../shared/page-url.constants';
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
                    'An unexpected error occurred.',
                    'Please click "Reconnect" to return to the previous page. Call us if you keep seeing this message.'
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
        this.saveToSession(title, body, showReconnect);
        this.router.navigate([pageUrls.ServiceError]);
    }

    private saveToSession(title: string, body: string, showReconnect = true): void {
        this.errorMessage.clear();
        this.errorMessage.set(new ErrorMessage(title, body, showReconnect));
    }
}
