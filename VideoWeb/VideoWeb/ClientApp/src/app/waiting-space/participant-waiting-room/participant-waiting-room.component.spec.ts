import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { of, throwError } from 'rxjs';
import { ConferenceResponse, ConferenceStatus, ParticipantStatus } from 'src/app/services/clients/api-client';
import { ConfigService } from 'src/app/services/api/config.service';
import { EventsService } from 'src/app/services/events.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockConfigService } from 'src/app/testing/mocks/MockConfigService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { ParticipantStatusListStubComponent } from 'src/app/testing/stubs/participant-status-list-stub';
import { ParticipantWaitingRoomComponent } from './participant-waiting-room.component';
import { ErrorService } from 'src/app/services/error.service';
import { AnalogueClockStubComponent } from 'src/app/testing/stubs/analogue-clock-stub';
import { Hearing } from '../../shared/models/hearing';


describe('ParticipantWaitingRoomComponent when conference exists', () => {
  let component: ParticipantWaitingRoomComponent;
  let fixture: ComponentFixture<ParticipantWaitingRoomComponent>;
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let route: ActivatedRoute;
  let adalService: MockAdalService;
  let eventService: MockEventsService;

  beforeEach(() => {
    const conference = new ConferenceTestData().getConferenceDetail();
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceById']);
    videoWebServiceSpy.getConferenceById.and.returnValue(of(conference));

    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule],
      declarations: [ParticipantWaitingRoomComponent, ParticipantStatusListStubComponent, AnalogueClockStubComponent],
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
    expect(component.hearing.getConference()).toBeDefined();
  });

  it('should update conference status', () => {
    const message = eventService.nextHearingStatusMessage;
    component.handleConferenceStatusChange(message);
    expect(component.hearing.getConference().status).toBe(message.status);
  });

  it('should update participant status', () => {
    const message = eventService.nextParticipantStatusMessage;
    component.handleParticipantStatusChange(message);
    const participant = component.hearing.getConference().participants.find(x => x.username === message.email);
    expect(participant.status).toBe(message.status);
  });

  it('should return correct conference status text when suspended', () => {
    component.hearing.getConference().status = ConferenceStatus.Suspended;
    expect(component.getConferenceStatusText()).toBe('is suspended');
  });

  it('should return correct conference status text when paused', () => {
    component.hearing.getConference().status = ConferenceStatus.Paused;
    expect(component.getConferenceStatusText()).toBe('is paused');
  });

  it('should return correct conference status text when closed', () => {
    component.hearing.getConference().status = ConferenceStatus.Closed;
    expect(component.getConferenceStatusText()).toBe('is closed');
  });

  it('should return correct conference status text when in session', () => {
    component.hearing.getConference().status = ConferenceStatus.InSession;
    expect(component.getConferenceStatusText()).toBe('is in session');
  });

  it('should return correct conference status text when not started', () => {
    const conference = new ConferenceTestData().getConferenceFuture();
    component.hearing = new Hearing(conference);
    component.hearing.getConference().status = ConferenceStatus.NotStarted;
    expect(component.getConferenceStatusText()).toBe('');
  });

  it('should return is about to begin header text', () => {
    const conference = new ConferenceTestData().getConferenceNow();
    conference.status = ConferenceStatus.NotStarted;
    component.hearing = new Hearing(conference);
    expect(component.getConferenceStatusText()).toBe('is about to begin');
  });

  it('should return is delayed header text', () => {
    const conference = new ConferenceTestData().getConferencePast();
    conference.status = ConferenceStatus.NotStarted;
    component.hearing = new Hearing(conference);
    expect(component.getConferenceStatusText()).toBe('is delayed');
  });

  it('should not show video stream when user is not connected to call', () => {
    component.connected = false;
    expect(component.showVideo()).toBeFalsy();
  });

  it('should show video stream when conference is in session', () => {
    component.connected = true;
    component.hearing.getConference().status = ConferenceStatus.InSession;
    expect(component.showVideo()).toBeTruthy();
  });

  it('should show video stream when participant is in consultation', () => {
    component.connected = true;
    component.hearing.getConference().status = ConferenceStatus.Paused;
    component.participant.status = ParticipantStatus.InConsultation;
    expect(component.showVideo()).toBeTruthy();
  });

  it('should not show video stream when hearing is not in session and participant is not in consultation', () => {
    component.connected = true;
    component.hearing.getConference().status = ConferenceStatus.Paused;
    component.participant.status = ParticipantStatus.Available;
    expect(component.showVideo()).toBeFalsy();
  });

  it('should not announce hearing is starting when already announced', () => {
    spyOn(component, 'announceHearingIsAboutToStart').and.callFake(() => { });
    component.hearingStartingAnnounced = true;
    component.checkIfHearingIsStarting();
    expect(component.announceHearingIsAboutToStart).toHaveBeenCalledTimes(0);
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
      declarations: [ParticipantWaitingRoomComponent, ParticipantStatusListStubComponent, AnalogueClockStubComponent],
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
    expect(component.hearing).toBeUndefined();
    expect(component.participant).toBeUndefined();
    expect(errorService.handleApiError).toHaveBeenCalled();
  });
});
