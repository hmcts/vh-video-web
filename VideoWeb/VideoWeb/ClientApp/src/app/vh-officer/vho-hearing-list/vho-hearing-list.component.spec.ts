import { ComponentFixture, TestBed } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { VhoHearingListComponent } from './vho-hearing-list.component';
import { VhoParticipantNetworkStatusStubComponent } from '../../testing/stubs/vho-participant-network-status-stub';

describe('VhoHearingListComponent', () => {
  let component: VhoHearingListComponent;
  let fixture: ComponentFixture<VhoHearingListComponent>;

  configureTestSuite(() => {
    TestBed.configureTestingModule({
      declarations: [ VhoHearingListComponent, VhoParticipantNetworkStatusStubComponent ]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VhoHearingListComponent);
    component = fixture.componentInstance;
    component.conferences = new ConferenceTestData().getTestData();
    fixture.detectChanges();
  });

  it('should return true if current conference is the same one selected', () => {
    component.currentConference = component.conferences[0];
    expect(component.isCurrentConference(component.conferences[0])).toBeTruthy();
  });

  it('should return false if current conference is not the same one selected', () => {
    component.currentConference = component.conferences[1];
    expect(component.isCurrentConference(component.conferences[0])).toBeFalsy();
  });

  it('should return false if current conference is null', () => {
    component.currentConference = null;
    expect(component.isCurrentConference(component.conferences[0])).toBeFalsy();
  });

  it('should get `Delayed` conference status text', () => {
    const conference = new ConferenceTestData().getConferencePast();
    conference.status = ConferenceStatus.NotStarted;
    expect(component.getConferenceStatusText(conference)).toBe('Delayed');
  });

  it('should get `Not Started` conference status text', () => {
    const conference = new ConferenceTestData().getConferenceNow();
    conference.status = ConferenceStatus.NotStarted;
    expect(component.getConferenceStatusText(conference)).toBe('Not Started');
  });

  it('should get `Suspended` conference status text', () => {
    const conference = new ConferenceTestData().getConferencePast();
    conference.status = ConferenceStatus.Suspended;
    expect(component.getConferenceStatusText(conference)).toBe('Suspended');
  });

  it('should get `Paused` conference status text', () => {
    const conference = new ConferenceTestData().getConferencePast();
    conference.status = ConferenceStatus.Paused;
    expect(component.getConferenceStatusText(conference)).toBe('Paused');
  });

  it('should get `Closed` conference status text', () => {
    const conference = new ConferenceTestData().getConferencePast();
    conference.status = ConferenceStatus.Closed;
    expect(component.getConferenceStatusText(conference)).toBe('Closed');
  });

  it('should get `In Session` conference status text', () => {
    const conference = new ConferenceTestData().getConferencePast();
    conference.status = ConferenceStatus.InSession;
    expect(component.getConferenceStatusText(conference)).toBe('In Session');
  });

  it('should emit conference selected', () => {
    spyOn(component, 'selectConference');
    const selectConference = component.conferences[0];
    component.selectConference(selectConference);
    expect(component.selectConference).toHaveBeenCalledWith(selectConference);
  });
});
