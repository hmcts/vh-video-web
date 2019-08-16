import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { PageUrls } from '../shared/page-url.constants';
import { ApiException } from './clients/api-client';
import { Logger } from './logging/logger-base';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  constructor(private router: Router, private logger: Logger) { }

  handleApiError(error: any) {
    this.logger.error('API error', error);
    if (!error.isApiException) { return; }
    const swaggerError: ApiException = error;
    switch (swaggerError.status) {
      case 401: return this.goToUnauthorised();
      case 404: return this.goToNotFound();
      default: return this.goToServiceError();
    }
  }

  returnHomeIfUnauthorised(error: any): boolean {
    if (!error.isApiException) { return; }
    const swaggerError: ApiException = error;
    if (swaggerError.status === 401) {
      this.logger.warn('Returning back to hearing list');
      this.router.navigate([PageUrls.Home]);
      return true;
    }
    return false;
  }

  goToUnauthorised() {
    this.router.navigate([PageUrls.Unauthorised]);
  }

  goToNotFound() {
    this.router.navigate([PageUrls.NotFound]);
  }

  goToServiceError() {
    this.router.navigate([PageUrls.ServiceError]);
  }
}
