import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { configureTestSuite } from 'ng-bullet';
import { of, throwError } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { HearingListTableStubComponent } from 'src/app/testing/stubs/hearing-list-table-stub';
import { ConferenceForUserResponse } from '../../services/clients/api-client';
import { ParticipantHearingsComponent } from './participant-hearings.component';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { Logger } from 'src/app/services/logging/logger-base';

describe('ParticipantHearingsComponent with no conferences for user', () => {
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let component: ParticipantHearingsComponent;
  let fixture: ComponentFixture<ParticipantHearingsComponent>;
  const noConferences: ConferenceForUserResponse[] = [];

  beforeEach(() => {
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferencesForIndividual']);
    videoWebServiceSpy.getConferencesForIndividual.and.returnValue(of(noConferences));

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SharedModule],
      declarations: [ParticipantHearingsComponent, HearingListTableStubComponent],
      providers: [
        { provide: VideoWebService, useValue: videoWebServiceSpy },
        { provide: Logger, useClass: MockLogger }
      ]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantHearingsComponent);
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

describe('ParticipantHearingsComponent with conferences for user', () => {
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let component: ParticipantHearingsComponent;
  let fixture: ComponentFixture<ParticipantHearingsComponent>;
  const conferences = new ConferenceTestData().getTestData();

  configureTestSuite(() => {
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferencesForIndividual']);
    videoWebServiceSpy.getConferencesForIndividual.and.returnValue(of(conferences));

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SharedModule],
      declarations: [ParticipantHearingsComponent, HearingListTableStubComponent],
      providers: [
        { provide: VideoWebService, useValue: videoWebServiceSpy },
        { provide: Logger, useClass: MockLogger }
      ]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantHearingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should list hearings', () => {
    expect(component.hasHearings()).toBeTruthy();
  });
});

describe('ParticipantHearingsComponent with service error', () => {
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let component: ParticipantHearingsComponent;
  let fixture: ComponentFixture<ParticipantHearingsComponent>;
  let errorService: ErrorService;

  configureTestSuite(() => {
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferencesForIndividual']);
    videoWebServiceSpy.getConferencesForIndividual.and.returnValue(throwError({ status: 401, isApiException: true }));

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SharedModule],
      declarations: [ParticipantHearingsComponent, HearingListTableStubComponent],
      providers: [
        { provide: VideoWebService, useValue: videoWebServiceSpy },
        { provide: Logger, useClass: MockLogger }
      ]
    });
  });

  beforeEach(() => {
    errorService = TestBed.get(ErrorService);
    fixture = TestBed.createComponent(ParticipantHearingsComponent);
    component = fixture.componentInstance;
  });

  it('should handle api error with error service', () => {
    spyOn(errorService, 'handleApiError').and.callFake(() => { Promise.resolve(true); });
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.loadingData).toBeFalsy();
    expect(errorService.handleApiError).toHaveBeenCalled();
  });
});
