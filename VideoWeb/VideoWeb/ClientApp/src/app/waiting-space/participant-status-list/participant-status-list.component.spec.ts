import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantStatusListComponent } from './participant-status-list.component';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ParticipantStatus, ParticipantResponse } from 'src/app/services/clients/api-client';
import { AdalService } from 'adal-angular4';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';

describe('ParticipantStatusListComponent', () => {
  let component: ParticipantStatusListComponent;
  let fixture: ComponentFixture<ParticipantStatusListComponent>;
  let adalService: MockAdalService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ParticipantStatusListComponent],
      providers: [
        { provide: AdalService, useClass: MockAdalService },
      ]
    })
      .compileComponents();
    adalService = TestBed.get(AdalService);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantStatusListComponent);
    component = fixture.componentInstance;
    component.conference = new ConferenceTestData().getConferenceDetail();
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

  it('should not be able to call an unavailable participant', () => {
    const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: 'test@dot.com' });
    expect(component.canCallParticipant(participant)).toBeFalsy();
  });

  it('should not be able to call self', () => {
    const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: 'chris.green@hearings.net' });
    expect(component.canCallParticipant(participant)).toBeFalsy();
  });

  it('should be able to call an available participant', () => {
    const participant = new ParticipantResponse({ status: ParticipantStatus.Available, username: 'test@dot.com' });
    expect(component.canCallParticipant(participant)).toBeTruthy();
  });

  it('should not be able to begin call self', () => {
    const participant = new ParticipantResponse({ status: ParticipantStatus.InConsultation, username: 'chris.green@hearings.net' });
    const spiedObject = spyOn<any>(component, 'raiseConsultationRequestEvent');
    component.begingCallWith(participant);
    expect(spiedObject).toHaveBeenCalledTimes(0);
  });

  it('should be able to begin call with another participant', () => {
    const participant = new ParticipantResponse({ status: ParticipantStatus.Available, username: 'test@dot.com' });
    const spiedObject = spyOn<any>(component, 'raiseConsultationRequestEvent');
    component.begingCallWith(participant);
    expect(spiedObject).toHaveBeenCalled();
  });
});
