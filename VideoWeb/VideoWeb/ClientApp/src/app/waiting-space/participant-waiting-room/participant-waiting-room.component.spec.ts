import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { of } from 'rxjs';
import { ConfigService } from 'src/app/services/api/config.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
  ConferenceStatus,
  ParticipantStatus,
  TokenResponse
} from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockConfigService } from 'src/app/testing/mocks/MockConfigService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { AnalogueClockStubComponent } from 'src/app/testing/stubs/analogue-clock-stub';
import { IndividualConsultationControlsStubComponent } from 'src/app/testing/stubs/individual-consultation-controls-stub';
import {
  IndividualParticipantStatusListStubComponent,
  JudgeParticipantStatusListStubComponent
} from 'src/app/testing/stubs/participant-status-list-stub';
import { Hearing } from '../../shared/models/hearing';
import { ParticipantWaitingRoomComponent } from './participant-waiting-room.component';

describe('ParticipantWaitingRoomComponent when conference exists', () => {
  let component: ParticipantWaitingRoomComponent;
  let fixture: ComponentFixture<ParticipantWaitingRoomComponent>;
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let route: ActivatedRoute;
  let adalService: MockAdalService;
  let eventService: MockEventsService;

  configureTestSuite(() => {
    const conference = new ConferenceTestData().getConferenceDetail();
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>(
      'VideoWebService',
      ['getConferenceById', 'getObfuscatedName', 'getJwToken']
    );
    videoWebServiceSpy.getConferenceById.and.returnValue(of(conference));
    videoWebServiceSpy.getObfuscatedName.and.returnValue('test-obfs');

    videoWebServiceSpy.getJwToken.and.returnValue(
      of(
        new TokenResponse({
          expires_on: '2021',
          token: 'token'
        })
      )
    );

    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule],
      declarations: [
        ParticipantWaitingRoomComponent,
        IndividualParticipantStatusListStubComponent,
        AnalogueClockStubComponent,
        JudgeParticipantStatusListStubComponent,
        IndividualConsultationControlsStubComponent
      ],
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
        { provide: EventsService, useClass: MockEventsService },
        { provide: Logger, useClass: MockLogger }
      ]
    });
  });

  beforeEach(() => {
    adalService = TestBed.get(AdalService);
    eventService = TestBed.get(EventsService);
    route = TestBed.get(ActivatedRoute);
    fixture = TestBed.createComponent(ParticipantWaitingRoomComponent);
    component = fixture.componentInstance;
    spyOn(component, 'call').and.callFake(() => {
      Promise.resolve(true);
    });
    spyOn(component, 'setupPexipClient').and.callFake(() => Promise.resolve());
    spyOn(component, 'startEventHubSubscribers').and.callFake(() => {});
    spyOn(component, 'getJwtokenAndConnectToPexip').and.callFake(() => {});
    component.heartbeat = jasmine.createSpyObj('heartbeat', ['kill']);
    component.ngOnInit();
  });

  it('should create and display conference details', async done => {
    await fixture.whenStable();
    expect(component).toBeTruthy();
    expect(component.loadingData).toBeFalsy();
    expect(component.hearing.getConference()).toBeDefined();
    done();
  });

  it('should update conference status', async done => {
    await fixture.whenStable();
    const message = eventService.nextHearingStatusMessage;
    component.handleConferenceStatusChange(message);
    expect(component.hearing.getConference().status).toBe(message.status);
    done();
  });

  it('should update participant status', async done => {
    await fixture.whenStable();
    const message = eventService.nextParticipantStatusMessage;
    component.handleParticipantStatusChange(message);
    const participant = component.hearing
      .getConference()
      .participants.find(x => x.id === message.participantId);
    expect(participant.status).toBe(message.status);
    done();
  });

  it('should return correct conference status text when suspended', async done => {
    await fixture.whenStable();
    component.hearing.getConference().status = ConferenceStatus.Suspended;
    expect(component.getConferenceStatusText()).toBe('is suspended');
    done();
  });

  it('should return correct conference status text when paused', async done => {
    await fixture.whenStable();
    component.hearing.getConference().status = ConferenceStatus.Paused;
    expect(component.getConferenceStatusText()).toBe('is paused');
    done();
  });

  it('should return correct conference status text when closed', async done => {
    await fixture.whenStable();
    component.hearing.getConference().status = ConferenceStatus.Closed;
    expect(component.getConferenceStatusText()).toBe('is closed');
    done();
  });

  it('should return correct conference status text when in session', async done => {
    await fixture.whenStable();
    component.hearing.getConference().status = ConferenceStatus.InSession;
    expect(component.getConferenceStatusText()).toBe('is in session');
    done();
  });

  it('should return correct conference status text when not started', async done => {
    await fixture.whenStable();
    const conference = new ConferenceTestData().getConferenceFuture();
    component.hearing = new Hearing(conference);
    component.hearing.getConference().status = ConferenceStatus.NotStarted;
    expect(component.getConferenceStatusText()).toBe('');
    done();
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

  it('should not show video stream when user is not connected to call', async done => {
    await fixture.whenStable();
    component.connected = false;
    component.updateShowVideo();
    expect(component.showVideo).toBeFalsy();
    done();
  });

  it('should show video stream when conference is in session', async done => {
    await fixture.whenStable();
    component.connected = true;
    component.hearing.getConference().status = ConferenceStatus.InSession;
    component.updateShowVideo();
    expect(component.showVideo).toBeTruthy();
    done();
  });

  it('should show video stream when participant is in consultation', async done => {
    await fixture.whenStable();
    component.connected = true;
    component.hearing.getConference().status = ConferenceStatus.Paused;
    component.participant.status = ParticipantStatus.InConsultation;
    component.updateShowVideo();
    expect(component.showVideo).toBeTruthy();
    done();
  });

  it('should not show video stream when hearing is not in session and participant is not in consultation', async done => {
    await fixture.whenStable();
    component.connected = true;
    component.hearing.getConference().status = ConferenceStatus.Paused;
    component.participant.status = ParticipantStatus.Available;
    component.updateShowVideo();
    expect(component.showVideo).toBeFalsy();
    done();
  });

  it('should not announce hearing is starting when already announced', async done => {
    await fixture.whenStable();
    spyOn(component, 'announceHearingIsAboutToStart').and.callFake(() => {});
    component.hearingStartingAnnounced = true;
    component.checkIfHearingIsStarting();
    expect(component.announceHearingIsAboutToStart).toHaveBeenCalledTimes(0);
    done();
  });
});
