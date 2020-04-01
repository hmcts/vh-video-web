import { ComponentFixture, TestBed } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { ConferenceStatus, ParticipantForUserResponse } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { VhoHearingListComponent } from './vho-hearing-list.component';
import { VhoParticipantNetworkStatusStubComponent } from '../../testing/stubs/vho-participant-network-status-stub';
import { HearingSummary } from '../../shared/models/hearing-summary';
import { ParticipantSummary } from '../../shared/models/participant-summary';
import { PerfectScrollbarStubComponent } from '../../testing/stubs/perfect-scrollbar-stub';

describe('VhoHearingListComponent', () => {
  let component: VhoHearingListComponent;
  let fixture: ComponentFixture<VhoHearingListComponent>;

  configureTestSuite(() => {
    TestBed.configureTestingModule({
      declarations: [VhoHearingListComponent, VhoParticipantNetworkStatusStubComponent,
        PerfectScrollbarStubComponent]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VhoHearingListComponent);
    component = fixture.componentInstance;
    component.conferences = new ConferenceTestData().getVhoTestData().map(c => new HearingSummary(c));
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
    const conference = new ConferenceTestData().getVHOConferencePast();
    conference.status = ConferenceStatus.NotStarted;
    expect(component.getConferenceStatusText(new HearingSummary(conference))).toBe('Delayed');
  });

  it('should get `Not Started` conference status text', () => {
    const conference = new ConferenceTestData().getConferenceFuture();
    conference.status = ConferenceStatus.NotStarted;
    expect(component.getConferenceStatusText(new HearingSummary(conference))).toBe('Not Started');
  });

  it('should get `Suspended` conference status text', () => {
    const conference = new ConferenceTestData().getConferenceFuture();
    conference.status = ConferenceStatus.Suspended;
    expect(component.getConferenceStatusText(new HearingSummary(conference))).toBe('Suspended');
  });

  it('should get `Paused` conference status text', () => {
    const conference = new ConferenceTestData().getConferenceFuture();
    conference.status = ConferenceStatus.Paused;
    expect(component.getConferenceStatusText(new HearingSummary(conference))).toBe('Paused');
  });

  it('should get `Closed` conference status text', () => {
    const conference = new ConferenceTestData().getConferenceFuture();
    conference.status = ConferenceStatus.Closed;
    expect(component.getConferenceStatusText(new HearingSummary(conference))).toBe('Closed');
  });

  it('should get `In Session` conference status text', () => {
    const conference = new ConferenceTestData().getConferenceFuture();
    conference.status = ConferenceStatus.InSession;
    expect(component.getConferenceStatusText(new HearingSummary(conference))).toBe('In Session');
  });

  it('should emit conference selected', () => {
    spyOn(component, 'selectConference');
    const selectConference = component.conferences[0];
    component.selectConference(selectConference);
    expect(component.selectConference).toHaveBeenCalledWith(selectConference);
  });
  it('should emit event with selected ParticipantSummary and conference id on the participant network status click', () => {
    spyOn(component.selectedParticipant, 'emit');
    const param = {
      participant: new ParticipantSummary(new ParticipantForUserResponse({ id: '1111-2222-3333' })),
      conferenceId: '1234-12345678'
    };
    component.showParticipantGraph(param);
    expect(component.selectedParticipant.emit).toHaveBeenCalled();
    expect(component.selectedParticipant.emit).toHaveBeenCalledWith(param);
  });
});
