import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { of } from 'rxjs';
import { ConfigService } from 'src/app/services/config.service';
import { ServerSentEventsService } from 'src/app/services/server-sent-events.service';
import { VideoWebService } from 'src/app/services/video-web.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockConfigService } from 'src/app/testing/mocks/MockConfigService';
import { MockServerSentEventsService } from 'src/app/testing/mocks/MockServerEventService';
import { VhoHearingsComponent } from './vho-hearings.component';
import { ConferenceResponse, ConsultationAnswer } from 'src/app/services/clients/api-client';
import { ConsultationMessage } from 'src/app/services/models/consultation-message';


describe('VhoHearingsComponent', () => {
  let component: VhoHearingsComponent;
  let fixture: ComponentFixture<VhoHearingsComponent>;
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let adalService: MockAdalService;
  let eventService: MockServerSentEventsService;
  const conferences = new ConferenceTestData().getTestData();

  beforeEach(async(() => {
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferencesForUser', 'getConferenceById']);
    videoWebServiceSpy.getConferencesForUser.and.returnValue(of(conferences));
    videoWebServiceSpy.getConferenceById.and.returnValue(of(new ConferenceTestData().getConferenceDetail()));

    TestBed.configureTestingModule({
      imports: [SharedModule, RouterTestingModule],
      declarations: [VhoHearingsComponent],
      providers: [
        { provide: VideoWebService, useValue: videoWebServiceSpy },
        { provide: AdalService, useClass: MockAdalService },
        { provide: ConfigService, useClass: MockConfigService },
        { provide: ServerSentEventsService, useClass: MockServerSentEventsService }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    adalService = TestBed.get(AdalService);
    eventService = TestBed.get(ServerSentEventsService);
    fixture = TestBed.createComponent(VhoHearingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.loadingData).toBeFalsy();
    expect(component.conferences).toBeDefined();
  });

  it('should retrieve conference and sanitise iframe uri', () => {
    component.displayAdminViewForConference(component.conferences[0]);
    expect(component.selectedConferenceUrl).toBeDefined();
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

  it('should return true when current conference is selected', () => {
    const currentConference = conferences[0];
    component.selectedConference = new ConferenceResponse({ id: currentConference.id });
    expect(component.isCurrentConference(currentConference)).toBeTruthy();
  });

  it('should return false when current conference null', () => {
    const currentConference = conferences[0];
    expect(component.isCurrentConference(currentConference)).toBeFalsy();
  });

  it('should return false when current conference is different', () => {
    const currentConference = conferences[0];
    component.selectedConference = new ConferenceResponse({ id: conferences[1].id });
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
});
