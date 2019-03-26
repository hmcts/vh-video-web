import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantStatusListComponent } from './participant-status-list.component';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ParticipantStatus, ParticipantResponse } from 'src/app/services/clients/api-client';

describe('ParticipantStatusListComponent', () => {
  let component: ParticipantStatusListComponent;
  let fixture: ComponentFixture<ParticipantStatusListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ParticipantStatusListComponent ]
    })
    .compileComponents();
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
    expect(component.getParticipantStatusText(new ParticipantResponse({status: ParticipantStatus.Disconnected}))).toBe('Unavailable');
    expect(component.getParticipantStatusText(new ParticipantResponse({status: ParticipantStatus.InConsultation}))).toBe('Unavailable');
    expect(component.getParticipantStatusText(new ParticipantResponse({status: ParticipantStatus.InHearing}))).toBe('Unavailable');
    expect(component.getParticipantStatusText(new ParticipantResponse({status: ParticipantStatus.Joining}))).toBe('Unavailable');
    expect(component.getParticipantStatusText(new ParticipantResponse({status: ParticipantStatus.NotSignedIn}))).toBe('Unavailable');
    expect(component.getParticipantStatusText(new ParticipantResponse({status: ParticipantStatus.UnableToJoin}))).toBe('Unavailable');
    expect(component.getParticipantStatusText(new ParticipantResponse({status: ParticipantStatus.None}))).toBe('Unavailable');
  });

  it('should return available text for when participant is available', () => {
    expect(component.getParticipantStatusText(new ParticipantResponse({status: ParticipantStatus.Available}))).toBe('Available');
  });
});
