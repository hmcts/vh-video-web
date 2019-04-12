import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JudgeWaitingRoomComponent } from './judge-waiting-room.component';
import { VideoWebService } from 'src/app/services/video-web.service';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { ConferenceResponse, ConferenceStatus } from 'src/app/services/clients/api-client';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { throwError, of } from 'rxjs';
import { SharedModule } from 'src/app/shared/shared.module';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { ConfigService } from 'src/app/services/config.service';
import { EventsService } from 'src/app/services/events.service';
import { MockConfigService } from 'src/app/testing/mocks/MockConfigService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ParticipantStatusListStubComponent } from 'src/app/testing/stubs/participant-status-list-stub';
import { PageUrls } from 'src/app/shared/page-url.constants';

describe('JudgeWaitingRoomComponent when conference exists', () => {
  let component: JudgeWaitingRoomComponent;
  let fixture: ComponentFixture<JudgeWaitingRoomComponent>;
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let route: ActivatedRoute;
  let router: Router;
  let conference: ConferenceResponse;
  let adalService: MockAdalService;
  let eventService: MockEventsService;

  beforeEach(async(() => {
    conference = new ConferenceTestData().getConferenceDetail();
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceById']);
    videoWebServiceSpy.getConferenceById.and.returnValue(of(conference));


    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule],
      declarations: [ JudgeWaitingRoomComponent, ParticipantStatusListStubComponent ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ conferenceId: conference.id })
            }
          },
        },
        { provide: VideoWebService, useValue: videoWebServiceSpy },
        { provide: AdalService, useClass: MockAdalService },
        { provide: ConfigService, useClass: MockConfigService },
        { provide: EventsService, useClass: MockEventsService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    adalService = TestBed.get(AdalService);
    eventService = TestBed.get(EventsService);
    route = TestBed.get(ActivatedRoute);
    router = TestBed.get(Router);
    fixture = TestBed.createComponent(JudgeWaitingRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and display conference details', () => {
    expect(component).toBeTruthy();
    expect(component.loadingData).toBeFalsy();
    expect(component.conference).toBeDefined();
  });

  it('should update conference status', () => {
    const conferenceStatus = ConferenceStatus.In_Session;
    component.handleHearingStatusChange(conferenceStatus);
    expect(component.conference.status).toBe(conferenceStatus);
  });

  it('should update participant status', () => {
    const message = eventService.nextParticipantStatusMessage;
    component.handleParticipantStatusChange(message);
    const participant = component.conference.participants.find(x => x.username === message.email);
    expect(participant.status === message.status);
  });

  it('should return correct conference status text when suspended', () => {
    component.conference.status = ConferenceStatus.Suspended;
    expect(component.getConferenceStatusText()).toBe('Resume the hearing');
  });

  it('should return correct conference status text when paused', () => {
    component.conference.status = ConferenceStatus.Paused;
    expect(component.getConferenceStatusText()).toBe('Resume the hearing');
  });

  it('should return correct conference status text when closed', () => {
    component.conference.status = ConferenceStatus.Closed;
    expect(component.getConferenceStatusText()).toBe('Hearing is closed');
  });

  it('should return correct conference status text when in session', () => {
    component.conference.status = ConferenceStatus.In_Session;
    expect(component.getConferenceStatusText()).toBe('');
  });

  it('should return correct conference status text when not started', () => {
    component.conference.status = ConferenceStatus.Not_Started;
    expect(component.getConferenceStatusText()).toBe('Start the hearing');
  });

  it('should return true when conference is paused', () => {
    component.conference.status = ConferenceStatus.Paused;
    expect(component.isPaused()).toBeTruthy();
  });

  it('should return false when conference is not paused', () => {
    component.conference.status = ConferenceStatus.In_Session;
    expect(component.isPaused()).toBeFalsy();
  });

  it('should return true when conference is not started', () => {
    component.conference.status = ConferenceStatus.Not_Started;
    expect(component.isNotStarted()).toBeTruthy();
  });

  it('should return false when conference is has started', () => {
    component.conference.status = ConferenceStatus.In_Session;
    expect(component.isNotStarted()).toBeFalsy();
  });

  it('should navigate to hearing room with conference id', () => {
    spyOn(router, 'navigate').and.callFake(() => { Promise.resolve(true); });
    component.goToHearingPage();
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.JudgeHearingRoom, component.conference.id]);
  });
});

describe('JudgeWaitingRoomComponent when conference does not exist', () => {
  let component: JudgeWaitingRoomComponent;
  let fixture: ComponentFixture<JudgeWaitingRoomComponent>;
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let route: ActivatedRoute;
  let router: Router;
  let conference: ConferenceResponse;
  let adalService: MockAdalService;

  beforeEach(async(() => {
    conference = new ConferenceTestData().getConferenceFuture();
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceById']);
    videoWebServiceSpy.getConferenceById.and.returnValue(throwError({ status: 404 }));


    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule],
      declarations: [ JudgeWaitingRoomComponent, ParticipantStatusListStubComponent ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ conferenceId: conference.id })
            }
          }
        },
        { provide: VideoWebService, useValue: videoWebServiceSpy },
        { provide: AdalService, useClass: MockAdalService },
        { provide: ConfigService, useClass: MockConfigService },
        { provide: EventsService, useClass: MockEventsService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    adalService = TestBed.get(AdalService);
    router = TestBed.get(Router);
    route = TestBed.get(ActivatedRoute);
    fixture = TestBed.createComponent(JudgeWaitingRoomComponent);
    component = fixture.componentInstance;
  });

  it('should redirect back home if conference not found', () => {
    spyOn(router, 'navigate').and.callFake(() => { Promise.resolve(true); });
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component).toBeTruthy();
    expect(component.loadingData).toBeFalsy();
    expect(component.conference).toBeUndefined();
    expect(router.navigate).toHaveBeenCalledWith(['home']);
  });
});
