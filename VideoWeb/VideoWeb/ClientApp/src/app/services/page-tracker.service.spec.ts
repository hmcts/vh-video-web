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
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should be created', inject([PageTrackerService], (service: PageTrackerService) => {
    expect(service).toBeTruthy();
  }));
});
