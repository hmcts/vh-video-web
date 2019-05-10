import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { of, throwError } from 'rxjs';
import { ConferenceResponse, ConferenceStatus, ParticipantStatus } from 'src/app/services/clients/api-client';
import { ConfigService } from 'src/app/services/config.service';
import { EventsService } from 'src/app/services/events.service';
import { VideoWebService } from 'src/app/services/video-web.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockConfigService } from 'src/app/testing/mocks/MockConfigService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { ParticipantStatusListStubComponent } from 'src/app/testing/stubs/participant-status-list-stub';
import { ParticipantWaitingRoomComponent } from './participant-waiting-room.component';
import { ErrorService } from 'src/app/services/error.service';


describe('ParticipantWaitingRoomComponent when conference exists', () => {
  let component: ParticipantWaitingRoomComponent;
  let fixture: ComponentFixture<ParticipantWaitingRoomComponent>;
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let route: ActivatedRoute;
  let conference: ConferenceResponse;
  let adalService: MockAdalService;
  let eventService: MockEventsService;

  beforeEach(() => {
    conference = new ConferenceTestData().getConferenceDetail();
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
          },
        },
        { provide: VideoWebService, useValue: videoWebServiceSpy },
        { provide: AdalService, useClass: MockAdalService },
        { provide: ConfigService, useClass: MockConfigService },
        { provide: EventsService, useClass: MockEventsService }
      ]
    })
      .compileComponents();

    adalService = TestBed.get(AdalService);
    eventService = TestBed.get(EventsService);
    route = TestBed.get(ActivatedRoute);
    fixture = TestBed.createComponent(ParticipantWaitingRoomComponent);
    component = fixture.componentInstance;
    spyOn(component, 'call').and.callFake(() => { Promise.resolve(true); });
    fixture.detectChanges();
  });

  it('should create and display conference details', () => {
    expect(component).toBeTruthy();
    expect(component.loadingData).toBeFalsy();
    expect(component.conference).toBeDefined();
  });

  it('should update conference status', () => {
    const message = eventService.nextHearingStatusMessage;
    component.handleConferenceStatusChange(message);
    expect(component.conference.status).toBe(message.status);
  });

  it('should update participant status', () => {
    const message = eventService.nextParticipantStatusMessage;
    component.handleParticipantStatusChange(message);
    const participant = component.conference.participants.find(x => x.username === message.email);
    expect(participant.status).toBe(message.status);
  });

  it('should return correct conference status text when suspended', () => {
    component.conference.status = ConferenceStatus.Suspended;
    expect(component.getConferenceStatusText()).toBe('is suspended');
  });

  it('should return correct conference status text when paused', () => {
    component.conference.status = ConferenceStatus.Paused;
    expect(component.getConferenceStatusText()).toBe('is paused');
  });

  it('should return correct conference status text when closed', () => {
    component.conference.status = ConferenceStatus.Closed;
    expect(component.getConferenceStatusText()).toBe('is closed');
  });

  it('should return correct conference status text when in session', () => {
    component.conference.status = ConferenceStatus.InSession;
    expect(component.getConferenceStatusText()).toBe('');
  });

  it('should return correct conference status text when not started', () => {
    component.conference = new ConferenceTestData().getConferenceFuture();
    component.conference.status = ConferenceStatus.NotStarted;
    expect(component.getConferenceStatusText()).toBe('');
  });

  it('should return is about to begin header text', () => {
    component.conference = new ConferenceTestData().getConferenceNow();
    component.conference.status = ConferenceStatus.NotStarted;
    expect(component.getConferenceStatusText()).toBe('is about to begin');
  });

  it('should return is delayed header text', () => {
    component.conference = new ConferenceTestData().getConferencePast();
    component.conference.status = ConferenceStatus.NotStarted;
    expect(component.getConferenceStatusText()).toBe('is delayed');
  });

  it('should return true when conference is closed', () => {
    component.conference.status = ConferenceStatus.Closed;
    expect(component.isClosed()).toBeTruthy();
  });

  it('should return false when conference is not closed', () => {
    component.conference.status = ConferenceStatus.InSession;
    expect(component.isClosed()).toBeFalsy();
  });

  it('should return true when conference is paused', () => {
    component.conference.status = ConferenceStatus.Paused;
    expect(component.isPaused()).toBeTruthy();
  });

  it('should return false when conference is not paused', () => {
    component.conference.status = ConferenceStatus.InSession;
    expect(component.isPaused()).toBeFalsy();
  });

  it('should return true when conference is suspended', () => {
    component.conference.status = ConferenceStatus.Suspended;
    expect(component.isSuspended()).toBeTruthy();
  });

  it('should return false when conference is not suspended', () => {
    component.conference.status = ConferenceStatus.Closed;
    expect(component.isSuspended()).toBeFalsy();
  });

  it('should not show video stream when user is not connected to call', () => {
    component.connected = false;
    expect(component.isSuspended()).toBeFalsy();
  });

  it('should show video stream when conference is in session', () => {
    component.connected = true;
    component.conference.status = ConferenceStatus.InSession;
    expect(component.showVideo()).toBeTruthy();
  });

  it('should show video stream when participant is in consultation', () => {
    component.connected = true;
    component.conference.status = ConferenceStatus.Paused;
    component.participant.status = ParticipantStatus.InConsultation;
    expect(component.showVideo()).toBeTruthy();
  });

  it('should not show video stream when hearing is not in session and participant is not in consultation', () => {
    component.connected = true;
    component.conference.status = ConferenceStatus.Paused;
    component.participant.status = ParticipantStatus.Available;
    expect(component.showVideo()).toBeFalsy();
  });

  it('should return end time', () => {
    const endTime = component.getScheduledEndTime();
    expect(endTime.getTime()).toBeGreaterThan(component.conference.scheduled_date_time.getTime());
    expect(component.showVideo()).toBeFalsy();
  });

  it('should return true when conference is delayed by more than ten minutes', () => {
    const pastConference = new ConferenceTestData().getConferencePast();
    pastConference.status = ConferenceStatus.NotStarted;
    component.conference = pastConference;
    expect(component.isDelayed()).toBeTruthy();
  });

  it('should return false when conference has started and passed scheduled start time', () => {
    const pastConference = new ConferenceTestData().getConferencePast();
    pastConference.status = ConferenceStatus.InSession;
    component.conference = pastConference;
    expect(component.isDelayed()).toBeFalsy();
  });

  it('should return false when conference is not delayed by more than ten minutes', () => {
    const pastConference = new ConferenceTestData().getConferenceFuture();
    pastConference.status = ConferenceStatus.NotStarted;
    component.conference = pastConference;
    expect(component.isDelayed()).toBeFalsy();
  });

  it('should return true when conference has not started and more than five minutes before start time', () => {
    const pastConference = new ConferenceTestData().getConferenceFuture();
    pastConference.status = ConferenceStatus.NotStarted;
    component.conference = pastConference;
    expect(component.isOnTime()).toBeTruthy();
  });

  it('should return false when conference has not started and less than five minutes before start time', () => {
    const pastConference = new ConferenceTestData().getConferenceNow();
    pastConference.status = ConferenceStatus.NotStarted;
    component.conference = pastConference;
    expect(component.isOnTime()).toBeFalsy();
  });

  it('should return true when conference is due to start within five minutes', () => {
    const pastConference = new ConferenceTestData().getConferenceNow();
    pastConference.status = ConferenceStatus.NotStarted;
    component.conference = pastConference;
    expect(component.isStarting()).toBeTruthy();
  });

  it('should return false when conference is more than five minutes delayed', () => {
    const pastConference = new ConferenceTestData().getConferenceFuture();
    pastConference.status = ConferenceStatus.NotStarted;
    component.conference = pastConference;
    expect(component.isStarting()).toBeFalsy();
  });

  it('should return false when conference is more than five minutes to start time', () => {
    const pastConference = new ConferenceTestData().getConferenceFuture();
    pastConference.status = ConferenceStatus.NotStarted;
    component.conference = pastConference;
    expect(component.isStarting()).toBeFalsy();
  });

  it('should return false when conference is due to start within five minutes but has started', () => {
    const pastConference = new ConferenceTestData().getConferenceNow();
    pastConference.status = ConferenceStatus.InSession;
    component.conference = pastConference;
    expect(component.isStarting()).toBeFalsy();
  });
});

describe('ParticipantWaitingRoomComponent when service returns an error', () => {
  let component: ParticipantWaitingRoomComponent;
  let fixture: ComponentFixture<ParticipantWaitingRoomComponent>;
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let route: ActivatedRoute;
  let router: Router;
  let conference: ConferenceResponse;
  let adalService: MockAdalService;
  let errorService: ErrorService;

  beforeEach(() => {
    conference = new ConferenceTestData().getConferenceFuture();
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceById']);
    videoWebServiceSpy.getConferenceById.and.returnValue(throwError({ status: 404, isSwaggerException: true }));

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
        { provide: VideoWebService, useValue: videoWebServiceSpy },
        { provide: AdalService, useClass: MockAdalService },
        { provide: ConfigService, useClass: MockConfigService },
        { provide: EventsService, useClass: MockEventsService }
      ]
    })
      .compileComponents();

    adalService = TestBed.get(AdalService);
    router = TestBed.get(Router);
    route = TestBed.get(ActivatedRoute);
    errorService = TestBed.get(ErrorService);
    fixture = TestBed.createComponent(ParticipantWaitingRoomComponent);
    component = fixture.componentInstance;
  });

  it('should handle api error with error service', () => {
    spyOn(errorService, 'handleApiError').and.callFake(() => { Promise.resolve(true); });
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.loadingData).toBeFalsy();
    expect(component.conference).toBeUndefined();
    expect(component.participant).toBeUndefined();
    expect(errorService.handleApiError).toHaveBeenCalled();
  });
});
