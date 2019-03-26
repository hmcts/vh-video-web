import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantWaitingRoomComponent } from './participant-waiting-room.component';
import { ParticipantStatusListStubComponent } from 'src/app/testing/stubs/participant-status-list-stub';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from 'src/app/shared/shared.module';
import { VideoWebService } from 'src/app/services/video-web.service';
import { of, throwError } from 'rxjs';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { ConferenceResponse } from 'src/app/services/clients/api-client';

describe('ParticipantWaitingRoomComponent when conference exists', () => {
  let component: ParticipantWaitingRoomComponent;
  let fixture: ComponentFixture<ParticipantWaitingRoomComponent>;
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let route: ActivatedRoute;
  let conference: ConferenceResponse;

  beforeEach(() => {
    conference = new ConferenceTestData().getConferenceFuture();
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceById']);
    videoWebServiceSpy.getConferenceById.and.returnValue(of(conference));

    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule],
      declarations: [ParticipantWaitingRoomComponent, ParticipantStatusListStubComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ conferenceId: conference.id })
            }
          }
        },
        { provide: VideoWebService, useValue: videoWebServiceSpy }
      ]
    })
      .compileComponents();

    route = TestBed.get(ActivatedRoute);
    fixture = TestBed.createComponent(ParticipantWaitingRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and display conference details', () => {
    expect(component).toBeTruthy();
    expect(component.loadingData).toBeFalsy();
    expect(component.conference).toBeDefined();
  });

  it('should redirect back home if conference not found', () => {
    expect(component).toBeTruthy();
    expect(component.loadingData).toBeFalsy();
    expect(component.conference).toBeDefined();
  });
});

describe('ParticipantWaitingRoomComponent when service returns an error', () => {
  let component: ParticipantWaitingRoomComponent;
  let fixture: ComponentFixture<ParticipantWaitingRoomComponent>;
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let route: ActivatedRoute;
  let router: Router;
  let conference: ConferenceResponse;

  beforeEach(() => {
    conference = new ConferenceTestData().getConferenceFuture();
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceById']);
    videoWebServiceSpy.getConferenceById.and.returnValue(throwError({ status: 404 }));

    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule],
      declarations: [ParticipantWaitingRoomComponent, ParticipantStatusListStubComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ conferenceId: conference.id })
            }
          }
        },
        { provide: VideoWebService, useValue: videoWebServiceSpy }
      ]
    })
      .compileComponents();

    router = TestBed.get(Router);
    route = TestBed.get(ActivatedRoute);
    fixture = TestBed.createComponent(ParticipantWaitingRoomComponent);
    component = fixture.componentInstance;
  });

  it('should redirect back home if conference not found', () => {
    spyOn(router, 'navigate').and.callFake(() => { Promise.resolve(true); });
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.loadingData).toBeFalsy();
    expect(component.conference).toBeUndefined();
    expect(router.navigate).toHaveBeenCalledWith(['home']);
  });
});
