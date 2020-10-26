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
        this.logger.error('API error', error);
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
                return this.goToServiceError(swaggerError.message, swaggerError.response);
        }
    }

    returnHomeIfUnauthorised(error: any): boolean {
        if (!ApiException.isApiException(error)) {
            return false;
        }
        const swaggerError: ApiException = error;
        if (swaggerError.status === 401) {
            this.logger.warn('Returning back to hearing list');
            this.router.navigate([pageUrls.Home]);
            return true;
        }
        return false;
    }

    goToUnauthorised() {
        this.router.navigate([pageUrls.Unauthorised]);
    }

    goToNotFound() {
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
