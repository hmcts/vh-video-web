import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { throwError } from 'rxjs';
import { ConfigService } from 'src/app/services/api/config.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { SharedModule } from 'src/app/shared/shared.module';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockConfigService } from 'src/app/testing/mocks/MockConfigService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { TasksTableStubComponent } from 'src/app/testing/stubs/task-table-stub';
import { VhoChatStubComponent } from 'src/app/testing/stubs/vho-chat-stub';
import { VhoHearingListStubComponent } from 'src/app/testing/stubs/vho-hearing-list-stub';
import { VhoParticipantStatusStubComponent } from 'src/app/testing/stubs/vho-participant-status-stub';
import { VhoHearingsFilterStubComponent } from '../../testing/stubs/vho-hearings-filter-stub';
import { VhoMonitoringGraphStubComponent } from '../../testing/stubs/vho-monitoring-graph-stub';
import { VhoHearingsComponent } from './vho-hearings.component';

describe('VhoHearingsComponent when conference retrieval fails', () => {
    let component: VhoHearingsComponent;
    let fixture: ComponentFixture<VhoHearingsComponent>;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    const mockEventsService = new MockEventsService();
    let adalService: MockAdalService;
    let errorService: ErrorService;

    configureTestSuite(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferencesForVHOfficer']);
        videoWebServiceSpy.getConferencesForVHOfficer.and.returnValue(throwError({ status: 404, isApiException: true }));

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
        component.selectedHearing = null;
    });

    it('should handle api error when retrieving conference fails', async () => {
        spyOn(errorService, 'handleApiError').and.callFake(() => {
            Promise.resolve(true);
        });
        component.retrieveHearingsForVhOfficer();
        await fixture.whenStable();
        expect(errorService.handleApiError).toHaveBeenCalledTimes(1);
    });
});
