import { JudgeHearingTableComponent } from './judge-hearing-table.component';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import * as moment from 'moment';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { PageUrls } from 'src/app/shared/page-url.constants';

describe('JudgeHearingTableComponent', () => {
  let component: JudgeHearingTableComponent;
  let fixture: ComponentFixture<JudgeHearingTableComponent>;
  let router: Router;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, FormsModule, RouterTestingModule],
      declarations: [JudgeHearingTableComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JudgeHearingTableComponent);
    component = fixture.componentInstance;
    component.conferences = new ConferenceTestData().getTestData();
    router = TestBed.get(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show sign in when start time is more 30 minutes from start time', () => {
    const conference = new ConferenceTestData().getConferenceFuture();
    expect(component.canStartHearing(conference)).toBeFalsy();
  });

  it('should show sign in when start time is less than 30 minutes from start time', () => {
    const conference = new ConferenceTestData().getConferencePast();
    expect(component.canStartHearing(conference)).toBeTruthy();
  });

  it('should show sign in time as 30 minutes prior to scheduled date time', () => {
    const conference = new ConferenceTestData().getConferenceFuture();
    const result = component.getSignInTime(conference);
    const difference = moment(conference.scheduled_date_time).diff(moment(result), 'minutes');
    expect(difference).toBe(30);
  });

  it('should show sign in date as "Today" when conference is in the past', () => {
    const conference = new ConferenceTestData().getConferencePast();
    const result = component.getSignInDate(conference);
    expect(result).toBe('Today');
  });

  it('should show sign in date as "Today" when conference is same date', () => {
    const conference = new ConferenceTestData().getConferenceNow();
    const result = component.getSignInDate(conference);
    expect(result).toBe('Today');
  });

  it('should show sign in date when conference is in the future date', () => {
    const conference = new ConferenceTestData().getConferenceFuture();
    const result = component.getSignInDate(conference);
    const expectedDateString = 'on ' + moment(conference.scheduled_date_time).format('Do MMM');
    expect(result).toBe(expectedDateString);
  });

  it('should navigate to equipment check page with conference id', () => {
    const conference = new ConferenceTestData().getConferenceFuture();
    spyOn(router, 'navigate').and.callFake(() => { });
    component.signIntoConference(conference);
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.JudgeWaitingRoom, conference.id]);
  });

  it('should return true when number of participants available is more than zero', () => {
    const conference = new ConferenceTestData().getConferenceFuture();
    conference.no_of_participants_available = 1;
    expect(component.hasAvailableParticipants(conference)).toBeTruthy();
  });

  it('should return false when number of participants available is zero', () => {
    const conference = new ConferenceTestData().getConferenceFuture();
    conference.no_of_participants_available = 0;
    expect(component.hasAvailableParticipants(conference)).toBeFalsy();
  });

  it('should return true when number of participants unavailable is more than zero', () => {
    const conference = new ConferenceTestData().getConferenceFuture();
    conference.no_of_participants_unavailable = 1;
    expect(component.hasUnavailableParticipants(conference)).toBeTruthy();
  });

  it('should return false when number of participants unavailable is zero', () => {
    const conference = new ConferenceTestData().getConferenceFuture();
    conference.no_of_participants_unavailable = 0;
    expect(component.hasUnavailableParticipants(conference)).toBeFalsy();
  });

  it('should return true when number of participants in consultation is more than zero', () => {
    const conference = new ConferenceTestData().getConferenceFuture();
    conference.no_of_participants_in_consultation = 1;
    expect(component.hasInConsultationParticipants(conference)).toBeTruthy();
  });

  it('should return false when number of participants in consultation is zero', () => {
    const conference = new ConferenceTestData().getConferenceFuture();
    conference.no_of_participants_in_consultation = 0;
    expect(component.hasInConsultationParticipants(conference)).toBeFalsy();
  });

  it('should return false hearing is not paused or suspended', () => {
    const conference = new ConferenceTestData().getConferenceFuture();
    conference.status = ConferenceStatus.InSession;
    expect(component.isPausedOrSuspended(conference)).toBeFalsy();
  });

  it('should return true hearing is not paused', () => {
    const conference = new ConferenceTestData().getConferenceFuture();
    conference.status = ConferenceStatus.Paused;
    expect(component.isPausedOrSuspended(conference)).toBeTruthy();
  });

  it('should return true hearing is not suspended', () => {
    const conference = new ConferenceTestData().getConferenceFuture();
    conference.status = ConferenceStatus.Suspended;
    expect(component.isPausedOrSuspended(conference)).toBeTruthy();
  });

  it('should return hour and minutes', () => {
    const result = component.getDuration(90);
    expect(result).toBe('1 hour and 30 minutes');
  });

  it('should return hours and minutes', () => {
    const result = component.getDuration(150);
    expect(result).toBe('2 hour and 30 minutes');
  });

  it('should return only minutes', () => {
    const result = component.getDuration(25);
    expect(result).toBe('25 minutes');
  });
});
