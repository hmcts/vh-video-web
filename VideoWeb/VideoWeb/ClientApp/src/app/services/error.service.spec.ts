import { TestBed, inject } from '@angular/core/testing';

import { ErrorService } from './error.service';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { PageUrls } from '../shared/page-url.constants';

describe('ErrorService', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [ErrorService]
    });

    router = TestBed.get(Router);
  });

  it('should be created', inject([ErrorService], (service: ErrorService) => {
    expect(service).toBeTruthy();
  }));

  it('should navigate to unauthorised', inject([ErrorService], (service: ErrorService) => {
    spyOn(router, 'navigate').and.callFake(() => { });
    const error = { status: 401, isSwaggerException: true };
    service.handleApiError(error);
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.Unauthorised]);
  }));

  it('should navigate to not found', inject([ErrorService], (service: ErrorService) => {
    spyOn(router, 'navigate').and.callFake(() => { });
    const error = { status: 404, isSwaggerException: true };
    service.handleApiError(error);
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.NotFound]);
  }));

  it('should navigate to service error', inject([ErrorService], (service: ErrorService) => {
    spyOn(router, 'navigate').and.callFake(() => { });
    const error = { status: 500, isSwaggerException: true };
    service.handleApiError(error);
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.ServiceError]);
  }));
});
