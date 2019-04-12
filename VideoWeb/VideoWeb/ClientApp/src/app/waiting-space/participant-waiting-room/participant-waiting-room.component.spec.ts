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
    component.conference.status = ConferenceStatus.In_Session;
    expect(component.getConferenceStatusText()).toBe('');
  });

  it('should return correct conference status text when not started', () => {
    component.conference.status = ConferenceStatus.Not_Started;
    expect(component.getConferenceStatusText()).toBe('');
  });

  it('should return true when conference is closed', () => {
    component.conference.status = ConferenceStatus.Closed;
    expect(component.isClosed()).toBeTruthy();
  });

  it('should return false when conference is not closed', () => {
    component.conference.status = ConferenceStatus.In_Session;
    expect(component.isClosed()).toBeFalsy();
  });

  it('should return true when conference is paused', () => {
    component.conference.status = ConferenceStatus.Paused;
    expect(component.isPaused()).toBeTruthy();
  });

  it('should return false when conference is not paused', () => {
    component.conference.status = ConferenceStatus.In_Session;
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
    component.conference.status = ConferenceStatus.In_Session;
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
});

describe('ParticipantWaitingRoomComponent when service returns an error', () => {
  let component: ParticipantWaitingRoomComponent;
  let fixture: ComponentFixture<ParticipantWaitingRoomComponent>;
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let route: ActivatedRoute;
  let router: Router;
  let conference: ConferenceResponse;
  let adalService: MockAdalService;

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
    fixture = TestBed.createComponent(ParticipantWaitingRoomComponent);
    component = fixture.componentInstance;
  });

  it('should redirect back home if conference not found', () => {
    spyOn(router, 'navigate').and.callFake(() => { Promise.resolve(true); });
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.loadingData).toBeFalsy();
    expect(component.conference).toBeUndefined();
    expect(component.participant).toBeUndefined();
    expect(router.navigate).toHaveBeenCalledWith(['home']);
  });
});
