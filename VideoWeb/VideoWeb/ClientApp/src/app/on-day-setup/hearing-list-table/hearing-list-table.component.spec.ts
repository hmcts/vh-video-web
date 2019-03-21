import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HearingListTableComponent } from './hearing-list-table.component';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';

import * as moment from 'moment';
import { RouterTestingModule } from '@angular/router/testing';

describe('HearingListTableComponent', () => {
  let component: HearingListTableComponent;
  let fixture: ComponentFixture<HearingListTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [ HearingListTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HearingListTableComponent);
    component = fixture.componentInstance;
    component.conferences = new ConferenceTestData().getTestData();
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
    const expectedDateString =  'on ' + moment(conference.scheduled_date_time).format('Do MMM');
    expect(result).toBe(expectedDateString);
  });
});
