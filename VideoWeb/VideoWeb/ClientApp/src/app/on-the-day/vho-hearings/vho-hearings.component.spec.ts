import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { of, throwError } from 'rxjs';
import { ConferenceResponse, ConsultationAnswer } from 'src/app/services/clients/api-client';
import { ConfigService } from 'src/app/services/config.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { ConsultationMessage } from 'src/app/services/models/consultation-message';
import { VideoWebService } from 'src/app/services/video-web.service';
import { Hearing } from 'src/app/shared/models/hearing';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockConfigService } from 'src/app/testing/mocks/MockConfigService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { TasksTableStubComponent } from 'src/app/testing/stubs/task-table-stub';
import { VhoHearingListStubComponent as VhoHearingListStubComponent } from 'src/app/testing/stubs/vho-hearing-list-stub';
import { VhoParticipantStatusStubComponent } from 'src/app/testing/stubs/vho-participant-status-stub';
import { TaskCompleted } from '../models/task-completed';
import { VhoHearingsComponent } from './vho-hearings.component';


describe('VhoHearingsComponent', () => {
  let component: VhoHearingsComponent;
  let fixture: ComponentFixture<VhoHearingsComponent>;
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let adalService: MockAdalService;
  let eventService: MockEventsService;
  const conferences = new ConferenceTestData().getTestData();
  let errorService: ErrorService;

  beforeEach(async(() => {
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferencesToday',
      'getConferenceById', 'getTasksForConference']);
    videoWebServiceSpy.getConferencesToday.and.returnValue(of(conferences));
    videoWebServiceSpy.getConferenceById.and.returnValue(of(new ConferenceTestData().getConferenceDetail()));
    videoWebServiceSpy.getTasksForConference.and.returnValue(of(new ConferenceTestData().getTasksForConference()));

    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule],
      declarations: [VhoHearingsComponent, TasksTableStubComponent, VhoHearingListStubComponent, VhoParticipantStatusStubComponent],
      providers: [
        { provide: VideoWebService, useValue: videoWebServiceSpy },
        { provide: AdalService, useClass: MockAdalService },
        { provide: ConfigService, useClass: MockConfigService },
        { provide: EventsService, useClass: MockEventsService }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    adalService = TestBed.get(AdalService);
    eventService = TestBed.get(EventsService);
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
    spyOn(errorService, 'handleApiError').and.callFake(() => { Promise.resolve(true); });
    videoWebServiceSpy.getConferenceById.and.returnValue(throwError({ status: 401, isSwaggerException: true }));
    component.onConferenceSelected(component.conferences[0]);
    expect(errorService.handleApiError).toHaveBeenCalled();
  });

  it('should return true when current conference is selected', () => {
    const currentConference = conferences[0];
    component.selectedHearing = new Hearing(new ConferenceResponse({ id: currentConference.id }));
    expect(component.isCurrentConference(currentConference)).toBeTruthy();
  });

  it('should return false when current conference null', () => {
    const currentConference = conferences[0];
    expect(component.isCurrentConference(currentConference)).toBeFalsy();
  });

  it('should return false when current conference is different', () => {
    const currentConference = conferences[0];
    component.selectedHearing = new Hearing(new ConferenceResponse({ id: conferences[1].id }));
    expect(component.isCurrentConference(currentConference)).toBeFalsy();
  });

  it('should add transfer task if consultation has been accepted', () => {
    spyOn(component, 'addTransferTask');
    const conference = conferences[0];
    const requestedBy = conference.participants[0].username;
    const requestedFor = conference.participants[1].username;
    const message = new ConsultationMessage(conference.id, requestedBy, requestedFor, ConsultationAnswer.Accepted);
    component.handleConsultationMessage(message);
    expect(component.addTransferTask).toHaveBeenCalled();
  });

  it('should load tasks for conference when current conference is selected', () => {
    const currentConference = conferences[0];
    component.selectedHearing = new Hearing(new ConferenceResponse({ id: currentConference.id }));
    component.getTasksForConference(currentConference.id);
    expect(component.tasks.length > 0).toBeTruthy();
  });

  it('should update number of pending tasks on task completed', () => {
    const currentConference = component.conferences[0];
    const initPendingTasks = 5;
    currentConference.no_of_pending_tasks = initPendingTasks;

    component.onTaskCompleted(new TaskCompleted(currentConference.id, 3));
    expect(component.conferences[0].no_of_pending_tasks).toBeLessThan(initPendingTasks);
  });

});

