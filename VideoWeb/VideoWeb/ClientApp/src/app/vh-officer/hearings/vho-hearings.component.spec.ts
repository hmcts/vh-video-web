import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { of, throwError } from 'rxjs';
import { ConfigService } from 'src/app/services/api/config.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Hearing } from 'src/app/shared/models/hearing';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockConfigService } from 'src/app/testing/mocks/MockConfigService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { TasksTableStubComponent } from 'src/app/testing/stubs/task-table-stub';
import { VhoHearingListStubComponent } from 'src/app/testing/stubs/vho-hearing-list-stub';
import { VhoParticipantStatusStubComponent } from 'src/app/testing/stubs/vho-participant-status-stub';
import { TaskCompleted } from '../../on-the-day/models/task-completed';
import { VhoHearingsComponent } from './vho-hearings.component';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { Logger } from 'src/app/services/logging/logger-base';
import { VhoHearingsFilterStubComponent } from '../../testing/stubs/vho-hearings-filter-stub';

describe('VhoHearingsComponent', () => {
  let component: VhoHearingsComponent;
  let fixture: ComponentFixture<VhoHearingsComponent>;
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let adalService: MockAdalService;
  const conferences = new ConferenceTestData().getTestData();
  let errorService: ErrorService;

  configureTestSuite(() => {
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>(
      'VideoWebService',
      [
        'getConferencesForVHOfficer',
        'getConferenceById',
        'getTasksForConference',
      ]
    );
    videoWebServiceSpy.getConferencesForVHOfficer.and.returnValue(
      of(conferences)
    );
    videoWebServiceSpy.getConferenceById.and.returnValue(
      of(new ConferenceTestData().getConferenceDetail())
    );
    videoWebServiceSpy.getTasksForConference.and.returnValue(
      of(new ConferenceTestData().getTasksForConference())
    );

    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule],
      declarations: [
        VhoHearingsComponent,
        TasksTableStubComponent,
        VhoHearingListStubComponent,
        VhoParticipantStatusStubComponent,
        VhoHearingsFilterStubComponent,
      ],
      providers: [
        { provide: VideoWebService, useValue: videoWebServiceSpy },
        { provide: AdalService, useClass: MockAdalService },
        { provide: EventsService, useClass: MockEventsService },
        { provide: ConfigService, useClass: MockConfigService },
        { provide: Logger, useClass: MockLogger },
      ],
    });
  });

  beforeEach(() => {
    adalService = TestBed.get(AdalService);
    errorService = TestBed.get(ErrorService);
    fixture = TestBed.createComponent(VhoHearingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should retrieve conference and sanitise iframe uri', () => {
    spyOn(component, 'updateWidthForAdminFrame');
    spyOn(component, 'getHeightForFrame').and.returnValue(600);

    component.onConferenceSelected(component.conferences[0]);
    expect(component.selectedConferenceUrl).toBeDefined();
  });

  it('should handle api error when retrieving conference fails', () => {
    spyOn(errorService, 'handleApiError').and.callFake(() => {
      Promise.resolve(true);
    });
    videoWebServiceSpy.getConferenceById.and.returnValue(
      throwError({ status: 404, isApiException: true })
    );
    component.onConferenceSelected(component.conferences[0]);
    expect(errorService.handleApiError).toHaveBeenCalled();
  });

  it('should return true when current conference is selected', () => {
    const currentConference = conferences[0];
    component.selectedHearing = new Hearing(
      new ConferenceResponse({ id: currentConference.id })
    );
    expect(component.isCurrentConference(currentConference)).toBeTruthy();
  });

  it('should return false when current conference null', () => {
    const currentConference = conferences[0];
    expect(component.isCurrentConference(currentConference)).toBeFalsy();
  });

  it('should return false when current conference is different', () => {
    const currentConference = conferences[0];
    component.selectedHearing = new Hearing(
      new ConferenceResponse({ id: conferences[1].id })
    );
    expect(component.isCurrentConference(currentConference)).toBeFalsy();
  });

  it('should load tasks for conference when current conference is selected', () => {
    const currentConference = conferences[0];
    component.selectedHearing = new Hearing(
      new ConferenceResponse({ id: currentConference.id })
    );
    component.getTasksForConference(currentConference.id);
    expect(component.tasks.length > 0).toBeTruthy();
  });

  it('should update number of pending tasks on task completed', () => {
    const currentConference = component.conferences[0];
    const initPendingTasks = 5;
    currentConference.no_of_pending_tasks = initPendingTasks;

    component.onTaskCompleted(new TaskCompleted(currentConference.id, 3));
    expect(component.conferences[0].no_of_pending_tasks).toBeLessThan(
      initPendingTasks
    );
  });
});
describe('VhoHearingsComponent Filter', () => {
  let component: VhoHearingsComponent;
  let fixture: ComponentFixture<VhoHearingsComponent>;
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let adalService: MockAdalService;
  const conferences = new ConferenceTestData().getTestDataForFilter();
  let errorService: ErrorService;
  const filter = new ConferenceTestData().getHearingsFilter();

  configureTestSuite(() => {
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>(
      'VideoWebService',
      [
        'getConferencesForVHOfficer',
        'getConferenceById',
        'getTasksForConference',
      ]
    );
    videoWebServiceSpy.getConferencesForVHOfficer.and.returnValue(
      of(conferences)
    );
    videoWebServiceSpy.getConferenceById.and.returnValue(
      of(new ConferenceTestData().getConferenceDetail())
    );
    videoWebServiceSpy.getTasksForConference.and.returnValue(
      of(new ConferenceTestData().getTasksForConference())
    );

    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule],
      declarations: [
        VhoHearingsComponent,
        TasksTableStubComponent,
        VhoHearingListStubComponent,
        VhoParticipantStatusStubComponent,
        VhoHearingsFilterStubComponent,
      ],
      providers: [
        { provide: VideoWebService, useValue: videoWebServiceSpy },
        { provide: AdalService, useClass: MockAdalService },
        { provide: EventsService, useClass: MockEventsService },
        { provide: ConfigService, useClass: MockConfigService },
        { provide: Logger, useClass: MockLogger },
      ],
    });
  });

  beforeEach(() => {
    adalService = TestBed.get(AdalService);
    errorService = TestBed.get(ErrorService);
    fixture = TestBed.createComponent(VhoHearingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it('should apply filter with selected all to conferences records', () => {
    expect(component.conferences.length).toBe(3);
    component.activateFilterOptions(filter);
    expect(component.conferences.length).toBe(3);
  });
  it('should apply filter with selected status and location to conferences records', () => {
    expect(component.conferences.length).toBe(3);
    filter.locations[1].Selected = true;
    filter.statuses[0].Selected = true;
    component.activateFilterOptions(filter);
    expect(component.conferences.length).toBe(2);
    expect(component.conferences[0].hearing_venue_name).toBe(
      filter.locations[1].Description
    );
    expect(component.conferences[1].hearing_venue_name).toBe(
      filter.locations[1].Description
    );
    expect(component.conferences[0].status).toBe(filter.statuses[0].Status);
    expect(component.conferences[1].status).toBe(filter.statuses[0].Status);
  });
  it('should apply filter with selected all to tasks records', () => {
    const currentConference = conferences[0];
    component.selectedHearing = new Hearing(
      new ConferenceResponse({ id: currentConference.id })
    );
    component.getTasksForConference(currentConference.id);
    expect(component.tasks.length === 2).toBeTruthy();

    component.activateTaskFilterOptions(filter);
    expect(component.tasks.length === 2).toBeTruthy();
  });
  it('should apply filter with selected alert status to tasks records', () => {
    const currentConference = conferences[0];
    component.selectedHearing = new Hearing(
      new ConferenceResponse({ id: currentConference.id })
    );
    component.getTasksForConference(currentConference.id);
    expect(component.tasks.length === 2).toBeTruthy();
    filter.alerts[0].Selected = true;
    component.activateTaskFilterOptions(filter);
    expect(component.tasks.length === 1).toBeTruthy();
    expect(
      component.tasks[0].body.includes(filter.alerts[0].BodyText)
    ).toBeTruthy();
  });
});
