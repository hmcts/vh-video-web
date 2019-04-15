import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { VideoWebService } from 'src/app/services/video-web.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { HearingListTableStubComponent } from 'src/app/testing/stubs/hearing-list-table-stub';
import { ConferenceForUserResponse } from '../../services/clients/api-client';
import { ParticipantHearingsComponent } from './participant-hearings.component';

describe('ParticipantHearingsComponent with no conferences for user', () => {
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let component: ParticipantHearingsComponent;
  let fixture: ComponentFixture<ParticipantHearingsComponent>;
  const noConferences: ConferenceForUserResponse[] = [];

  beforeEach(() => {
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferencesForUser']);
    videoWebServiceSpy.getConferencesForUser.and.returnValue(of(noConferences));

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SharedModule],
      declarations: [ParticipantHearingsComponent, HearingListTableStubComponent],
      providers: [
        { provide: VideoWebService, useValue: videoWebServiceSpy }
      ]
    })
      .compileComponents();

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

  beforeEach(() => {
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferencesForUser']);
    videoWebServiceSpy.getConferencesForUser.and.returnValue(of(conferences));

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SharedModule],
      declarations: [ParticipantHearingsComponent, HearingListTableStubComponent],
      providers: [
        { provide: VideoWebService, useValue: videoWebServiceSpy }
      ]
    })
      .compileComponents();

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
