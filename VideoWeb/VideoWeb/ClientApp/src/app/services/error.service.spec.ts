import { TestBed, inject } from '@angular/core/testing';

import { ErrorService } from './error.service';
import { RouterTestingModule } from '@angular/router/testing';
import { SwaggerException } from './clients/api-client';

describe('ErrorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [ErrorService]
    });
  });

  it('should be created', inject([ErrorService], (service: ErrorService) => {
    expect(service).toBeTruthy();
  }));

  it('should navigate to unauthorised', inject([ErrorService], (service: ErrorService) => {
    spyOn(service, 'goToUnauthorised').and.callFake(() => { });
    const error = { status: 401, isSwaggerException: true };
    service.handleApiError(error);
    expect(service.goToUnauthorised).toHaveBeenCalled();
  }));

  it('should navigate to not found', inject([ErrorService], (service: ErrorService) => {
    spyOn(service, 'goToNotFound').and.callFake(() => { });
    const error = { status: 404, isSwaggerException: true };
    service.handleApiError(error);
    expect(service.goToNotFound).toHaveBeenCalled();
  }));

  it('should navigate to service error', inject([ErrorService], (service: ErrorService) => {
    spyOn(service, 'goToServiceError').and.callFake(() => { });
    const error = { status: 500, isSwaggerException: true };
    service.handleApiError(error);
    expect(service.goToServiceError).toHaveBeenCalled();
  }));
});
