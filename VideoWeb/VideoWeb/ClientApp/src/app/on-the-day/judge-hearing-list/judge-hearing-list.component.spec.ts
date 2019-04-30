import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { VideoWebService } from 'src/app/services/video-web.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { JudgeHearingTableStubComponent } from 'src/app/testing/stubs/judge-hearing-list-table-stub';
import { ConferenceForUserResponse } from '../../services/clients/api-client';
import { JudgeHearingListComponent } from './judge-hearing-list.component';
import { ErrorService } from 'src/app/services/error.service';

describe('JudgeHearingListComponent with no conferences for user', () => {
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let component: JudgeHearingListComponent;
  let fixture: ComponentFixture<JudgeHearingListComponent>;
  const noConferences: ConferenceForUserResponse[] = [];

  beforeEach(() => {
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferencesForUser']);
    videoWebServiceSpy.getConferencesForUser.and.returnValue(of(noConferences));

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SharedModule],
      declarations: [JudgeHearingListComponent, JudgeHearingTableStubComponent],
      providers: [
        { provide: VideoWebService, useValue: videoWebServiceSpy }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(JudgeHearingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show no hearings message', () => {
    expect(component.hasHearings()).toBeFalsy();
  });
});

describe('JudgeHearingListComponent with conferences for user', () => {
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let component: JudgeHearingListComponent;
  let fixture: ComponentFixture<JudgeHearingListComponent>;
  const conferences = new ConferenceTestData().getTestData();
  let router: Router;

  beforeEach(() => {
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferencesForUser']);
    videoWebServiceSpy.getConferencesForUser.and.returnValue(of(conferences));

    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule],
      declarations: [JudgeHearingListComponent, JudgeHearingTableStubComponent],
      providers: [
        { provide: VideoWebService, useValue: videoWebServiceSpy }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(JudgeHearingListComponent);
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

describe('JudgeHearingListComponent with service error', () => {
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let component: JudgeHearingListComponent;
  let fixture: ComponentFixture<JudgeHearingListComponent>;
  let errorService: ErrorService;

  beforeEach(() => {
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferencesForUser']);
    videoWebServiceSpy.getConferencesForUser.and.returnValue(throwError({ status: 401, isSwaggerException: true }));

    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule],
      declarations: [JudgeHearingListComponent, JudgeHearingTableStubComponent],
      providers: [
        { provide: VideoWebService, useValue: videoWebServiceSpy }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(JudgeHearingListComponent);
    component = fixture.componentInstance;
    errorService = TestBed.get(ErrorService);
  });

  it('should handle api error with error service', () => {
    spyOn(errorService, 'handleApiError').and.callFake(() => { Promise.resolve(true); });
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.loadingData).toBeFalsy();
    expect(errorService.handleApiError).toHaveBeenCalled();
  });
});
