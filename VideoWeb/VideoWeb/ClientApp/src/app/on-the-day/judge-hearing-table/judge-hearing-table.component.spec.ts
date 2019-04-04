import { JudgeHearingTableComponent } from './judge-hearing-table.component';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import * as moment from 'moment';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

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
    expect(router.navigate).toHaveBeenCalledWith(['/judge-waiting-room', conference.id]);
  });
});
