import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import * as moment from 'moment';
import { configureTestSuite } from 'ng-bullet';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { HearingListTableComponent } from './hearing-list-table.component';


describe('HearingListTableComponent', () => {
  let component: HearingListTableComponent;
  let fixture: ComponentFixture<HearingListTableComponent>;
  let router: Router;

  configureTestSuite(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [HearingListTableComponent]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HearingListTableComponent);
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
    expect(router.navigate).toHaveBeenCalledWith([PageUrls.EquipmentCheck, conference.id]);
  });
});
