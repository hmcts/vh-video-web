import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { PageUrls } from '../shared/page-url.constants';
import { ApiException } from './clients/api-client';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  constructor(private router: Router) { }

  handleApiError(error: any) {
    if (!error.isApiException) { return; }
    const swaggerError: ApiException = error;
    switch (swaggerError.status) {
      case 401: return this.goToUnauthorised();
      case 404: return this.goToNotFound();
      default: return this.goToServiceError();
    }
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
