import { TestBed } from '@angular/core/testing';

import { MultipleIdpInterceptorService } from './multiple-idp-interceptor.service';

describe('MultipleIdpInterceptorService', () => {
  let service: MultipleIdpInterceptorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MultipleIdpInterceptorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
