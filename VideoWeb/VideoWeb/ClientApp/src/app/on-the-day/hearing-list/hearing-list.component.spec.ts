import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HearingListComponent } from './hearing-list.component';
import { ConferenceForUserResponse } from '../../services/clients/api-client';
import { SharedModule } from 'src/app/shared/shared.module';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { VideoWebService } from 'src/app/services/video-web.service';
import { JudgeHearingTableStubComponent } from 'src/app/testing/stubs/judge-hearing-list-table-stub';
import { RouterTestingModule } from '@angular/router/testing';

describe('HearingListComponent with no conferences for user', () => {
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let component: HearingListComponent;
  let fixture: ComponentFixture<HearingListComponent>;
  const noConferences: ConferenceForUserResponse[] = [];
  let router: Router;

  beforeEach(() => {
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferencesForUser']);
    videoWebServiceSpy.getConferencesForUser.and.returnValue(of(noConferences));

    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule],
      declarations: [HearingListComponent, JudgeHearingTableStubComponent],
      providers: [
        { provide: VideoWebService, useValue: videoWebServiceSpy }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(HearingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    router = TestBed.get(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show no hearings message', () => {
    expect(component.hasHearings()).toBeFalsy();
  });
});

describe('HearingListComponent with conferences for user', () => {
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let component: HearingListComponent;
  let fixture: ComponentFixture<HearingListComponent>;
  const conferences = new ConferenceTestData().getTestData();
  let router: Router;

  beforeEach(() => {
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferencesForUser']);
    videoWebServiceSpy.getConferencesForUser.and.returnValue(of(conferences));

    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule],
      declarations: [HearingListComponent, JudgeHearingTableStubComponent],
      providers: [
        { provide: VideoWebService, useValue: videoWebServiceSpy }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(HearingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    router = TestBed.get(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should list hearings', () => {
    expect(component.hasHearings()).toBeTruthy();
  });
});
