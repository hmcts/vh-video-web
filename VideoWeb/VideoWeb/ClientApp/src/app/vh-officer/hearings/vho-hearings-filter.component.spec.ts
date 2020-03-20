import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { of } from 'rxjs';
import { ConfigService } from 'src/app/services/api/config.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockConfigService } from 'src/app/testing/mocks/MockConfigService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { TasksTableStubComponent } from 'src/app/testing/stubs/task-table-stub';
import { VhoHearingListStubComponent } from 'src/app/testing/stubs/vho-hearing-list-stub';
import { VhoParticipantStatusStubComponent } from 'src/app/testing/stubs/vho-participant-status-stub';
import { VhoHearingsFilterStubComponent } from '../../testing/stubs/vho-hearings-filter-stub';
import { VhoHearingsComponent } from './vho-hearings.component';
import { VhoChatStubComponent } from 'src/app/testing/stubs/vho-chat-stub';
import { VhoMonitoringGraphStubComponent } from 'src/app/testing/stubs/vho-monitoring-graph-stub';
import { ParticipantSummary } from '../../shared/models/participant-summary';
import { ParticipantForUserResponse, ParticipantStatus, ParticipantHeartbeatResponse } from '../../services/clients/api-client';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';

describe('VhoHearingsComponent Filter', () => {
    let component: VhoHearingsComponent;
    let fixture: ComponentFixture<VhoHearingsComponent>;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let adalService: MockAdalService;
    const conferences = new ConferenceTestData().getTestDataForFilter();
    let errorService: ErrorService;
    const filter = new ConferenceTestData().getHearingsFilter();
    const mockEventsService = new MockEventsService(true);

    configureTestSuite(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getConferencesForVHOfficer',
            'getConferenceById',
            'getTasksForConference',
            'getParticipantHeartbeats'
        ]);
        videoWebServiceSpy.getConferencesForVHOfficer.and.returnValue(of(conferences));
        videoWebServiceSpy.getConferenceById.and.returnValue(new ConferenceTestData().getConferenceDetailFuture());
        videoWebServiceSpy.getTasksForConference.and.returnValue(new ConferenceTestData().getTasksForConference());
        videoWebServiceSpy.getParticipantHeartbeats.and.returnValue([new ParticipantHeartbeatResponse()]);
        TestBed.configureTestingModule({
            imports: [SharedModule, RouterTestingModule],
            declarations: [
                VhoHearingsComponent,
                TasksTableStubComponent,
                VhoHearingListStubComponent,
                VhoParticipantStatusStubComponent,
                VhoHearingsFilterStubComponent,
                VhoChatStubComponent,
                VhoMonitoringGraphStubComponent
            ],
            providers: [
                { provide: VideoWebService, useValue: videoWebServiceSpy },
                { provide: AdalService, useClass: MockAdalService },
                { provide: EventsService, useValue: mockEventsService },
                { provide: ConfigService, useClass: MockConfigService },
                { provide: Logger, useClass: MockLogger }
            ]
        });
    });

    beforeEach(() => {
        adalService = TestBed.get(AdalService);
        errorService = TestBed.get(ErrorService);
        fixture = TestBed.createComponent(VhoHearingsComponent);
        component = fixture.componentInstance;
        component.conferencesAll = conferences;
        component.conferences = component.conferencesAll.map(c => new HearingSummary(c));
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
        expect(component.conferences[0].hearingVenueName).toBe(filter.locations[1].Description);
        expect(component.conferences[1].hearingVenueName).toBe(filter.locations[1].Description);
        expect(component.conferences[0].status).toBe(filter.statuses[0].Status);
        expect(component.conferences[1].status).toBe(filter.statuses[0].Status);
    });

    it('should apply filter with selected alerts records', () => {
        expect(component.conferences.length).toBe(3);
        filter.locations.forEach(x => (x.Selected = false));
        filter.statuses.forEach(x => (x.Selected = false));
        filter.alerts[1].Selected = true;
        const expectedAlerts1 = filter.alerts[1].BodyText;
        component.activateFilterOptions(filter);

        expect(component.conferences.length).toBe(2);
        const filtered1 = component.conferences[0].tasks.filter(x => x.body.includes(expectedAlerts1)).length > 0;
        expect(filtered1).toBe(true);
        const filtered2 = component.conferences[1].tasks.filter(x => x.body.includes(expectedAlerts1)).length > 0;
        expect(filtered2).toBe(true);
    });
    it('should close monitoring graph for selected participant', () => {
        component.displayGraph = true;
        component.closeGraph(true);
        expect(component.displayGraph).toBe(false);
    });
});
