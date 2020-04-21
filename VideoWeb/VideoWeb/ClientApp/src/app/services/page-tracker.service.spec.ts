import { TestBed, inject } from '@angular/core/testing';
import { PageTrackerService } from './page-tracker.service';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Component, NgModule } from '@angular/core';

describe('PageTrackerService', () => {
  let pageTrackerService: PageTrackerService;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        PageTrackerService,
        { provide: Router, useValue: routerSpy },
      ],
    });

    pageTrackerService = TestBed.get(PageTrackerService);
    const mockSessionStorage = {
      getItem: (key: string): string => {
        return 'true';
      },
      setItem: (key: string, value: string) => {
      },
      removeItem: (key: string) => {
      },
      clear: () => {
      }
    };
    spyOn(sessionStorage, 'getItem')
      .and.callFake(mockSessionStorage.getItem);
    spyOn(sessionStorage, 'setItem')
      .and.callFake(mockSessionStorage.setItem);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should be created', inject([PageTrackerService], (service: PageTrackerService) => {
    expect(service).toBeTruthy();
  }));

  it('it should retrieve data from session', inject([PageTrackerService], (service: PageTrackerService) => {
    service.getPreviousUrl();
    expect(sessionStorage.getItem).toHaveBeenCalled();
  }));
/*   it('it should save data to session', inject([PageTrackerService], (service: PageTrackerService) => {
    service.trackPreviousPage(routerSpy);
    expect(sessionStorage.setItem).toHaveBeenCalled();
  })); */
});
