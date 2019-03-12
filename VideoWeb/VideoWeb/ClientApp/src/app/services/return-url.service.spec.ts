import { TestBed, inject } from '@angular/core/testing';

import { ReturnUrlService } from './return-url.service';

describe('ReturnUrlService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReturnUrlService]
    });
  });

  it('should be created', inject([ReturnUrlService], (service: ReturnUrlService) => {
    expect(service).toBeTruthy();
  }));

  it('should return null if no key is stored', inject([ReturnUrlService], (service: ReturnUrlService)  => {
    expect(service.popUrl()).toBeNull();
  }));

  it('should delete the stored url after popping', inject([ReturnUrlService], (service: ReturnUrlService)  => {
    service.setUrl('first url');
    expect(service.popUrl()).toBe('first url');
    expect(service.popUrl()).toBeNull();
  }));

  it('should use the last stored url', inject([ReturnUrlService], (service: ReturnUrlService)  => {
    service.setUrl('first url');
    service.setUrl('second url');
    expect(service.popUrl()).toBe('second url');
  }));
});
