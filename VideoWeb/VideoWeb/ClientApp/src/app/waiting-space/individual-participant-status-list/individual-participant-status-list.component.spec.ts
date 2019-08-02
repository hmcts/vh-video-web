import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { ConfigService } from 'src/app/services/api/config.service';
import {
  ParticipantResponse, ParticipantStatus, UserRole, ConferenceResponse, ConferenceStatus
} from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockConfigService } from 'src/app/testing/mocks/MockConfigService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { IndividualParticipantStatusListComponent } from './individual-participant-status-list.component';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { of } from 'rxjs';


describe('IndividualParticipantStatusListComponent', () => {
  let component: IndividualParticipantStatusListComponent;
  let fixture: ComponentFixture<IndividualParticipantStatusListComponent>;
  let adalService: MockAdalService;
  let eventService: MockEventsService;
  let consultationService: ConsultationService;
  let conference: ConferenceResponse;


  configureTestSuite(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule],
      declarations: [IndividualParticipantStatusListComponent],
      providers: [
        { provide: AdalService, useClass: MockAdalService },
        { provide: ConfigService, useClass: MockConfigService },
        { provide: EventsService, useClass: MockEventsService },
        { provide: Logger, useClass: MockLogger }
      ]
    });
    adalService = TestBed.get(AdalService);
    eventService = TestBed.get(EventsService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndividualParticipantStatusListComponent);
    component = fixture.componentInstance;
    consultationService = TestBed.get(ConsultationService);
    conference = new ConferenceTestData().getConferenceDetail();
    component.conference = conference;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.judge).toBeDefined();
    expect(component.nonJugdeParticipants).toBeDefined();
  });

  it('should return true when participant is available', () => {
    const availableParticipant = component.conference.participants.find(x => x.status === ParticipantStatus.Available);
    expect(component.isParticipantAvailable(availableParticipant)).toBeTruthy();
  });

  it('should return false when participant is not available', () => {
    const availableParticipant = component.conference.participants.find(x => x.status !== ParticipantStatus.Available);
    expect(component.isParticipantAvailable(availableParticipant)).toBeFalsy();
  });

  it('should return unavailable text for all non-available statuses', () => {
    expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.Disconnected }))).toBe('Unavailable');
    expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.InConsultation }))).toBe('Unavailable');
    expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.InHearing }))).toBe('Unavailable');
    expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.Joining }))).toBe('Unavailable');
    expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.NotSignedIn }))).toBe('Unavailable');
    expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.UnableToJoin }))).toBe('Unavailable');
    expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.None }))).toBe('Unavailable');
  });

  it('should return available text for when participant is available', () => {
    expect(component.getParticipantStatusText(new ParticipantResponse({ status: ParticipantStatus.Available }))).toBe('Available');
  });

  it('should not be able to call participant is user is judge', () => {
    const judge = component.conference.participants.find(x => x.role === UserRole.Judge);
    adalService.userInfo.userName = judge.username;
    const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: 'test@dot.com' });
    expect(component.canCallParticipant(participant)).toBeFalsy();
  });

  it('should not be able to call an unavailable participant', () => {
    const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: 'test@dot.com' });
    expect(component.canCallParticipant(participant)).toBeFalsy();
  });

  it('should not be able to call self', () => {
    component.conference = new ConferenceTestData().getConferenceFuture();
    const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: adalService.userInfo.userName });
    expect(component.canCallParticipant(participant)).toBeFalsy();
  });

  it('should not be able to call when hearing is about to start', () => {
    const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: adalService.userInfo.userName });
    expect(component.canCallParticipant(participant)).toBeFalsy();
  });

  it('should not be able to call when hearing is delayed', () => {
    component.conference = new ConferenceTestData().getConferencePast();
    const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: adalService.userInfo.userName });
    expect(component.canCallParticipant(participant)).toBeFalsy();
  });

  it('should not be able to call when hearing is suspended', () => {
    component.conference.status = ConferenceStatus.Suspended;
    const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: adalService.userInfo.userName });
    expect(component.canCallParticipant(participant)).toBeFalsy();
  });

  it('should not be able to call when user is judge', () => {
    const participant = conference.participants.find(x => x.role === UserRole.Judge);
    adalService.userInfo.userName = participant.username;
    expect(component.canCallParticipant(participant)).toBeFalsy();
  });

  it('should not be able to call when hearing is about to start', () => {
    const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: adalService.userInfo.userName });
    expect(component.canCallParticipant(participant)).toBeFalsy();
  });

  it('should not be able to begin call self', () => {
    spyOn(consultationService, 'raiseConsultationRequest').and.callFake(() => of());
    adalService.userInfo.userName = 'chris.green@hearings.net';
    const participant = conference.participants.find(x => x.username === adalService.userInfo.userName);
    component.begingCallWith(participant);
    expect(consultationService.raiseConsultationRequest).toHaveBeenCalledTimes(0);
  });

  it('should be able to call an available participant', () => {
    const participant = new ParticipantResponse({ status: ParticipantStatus.Available, username: 'test@dot.com' });
    expect(component.canCallParticipant(participant)).toBeTruthy();
  });

  it('should be able to begin call with another participant', () => {
    spyOn(consultationService, 'raiseConsultationRequest').and.callFake(() => of());
    const participant = conference.participants.find(x => x.username === 'james.green@hearings.net');
    participant.status = ParticipantStatus.Available;
    component.begingCallWith(participant);
    expect(consultationService.raiseConsultationRequest).toHaveBeenCalled();
  });
});
