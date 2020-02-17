import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { throwError } from 'rxjs';
import { ConfigService } from 'src/app/services/api/config.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockConfigService } from 'src/app/testing/mocks/MockConfigService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { JudgeParticipantStatusListStubComponent } from 'src/app/testing/stubs/participant-status-list-stub';
import { JudgeWaitingRoomComponent } from './judge-waiting-room.component';
import { JudgeChatStubComponent } from 'src/app/testing/stubs/judge-chat-stub.component';

describe('JudgeWaitingRoomComponent when conference does not exist', () => {
    let component: JudgeWaitingRoomComponent;
    let fixture: ComponentFixture<JudgeWaitingRoomComponent>;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let route: ActivatedRoute;
    let conference: ConferenceResponse;
    let errorService: ErrorService;

    configureTestSuite(() => {
        conference = new ConferenceTestData().getConferenceFuture();
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceById']);
        videoWebServiceSpy.getConferenceById.and.returnValue(throwError({ status: 404, isApiException: true }));

        TestBed.configureTestingModule({
            imports: [SharedModule, RouterTestingModule],
            declarations: [JudgeWaitingRoomComponent, JudgeParticipantStatusListStubComponent, JudgeChatStubComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: convertToParamMap({ conferenceId: conference.id })
                        }
                    }
                },
                { provide: VideoWebService, useValue: videoWebServiceSpy },
                { provide: AdalService, useClass: MockAdalService },
                { provide: ConfigService, useClass: MockConfigService },
                { provide: EventsService, useClass: MockEventsService },
                { provide: Logger, useClass: MockLogger }
            ]
        });
    });

    beforeEach(() => {
        route = TestBed.get(ActivatedRoute);
        errorService = TestBed.get(ErrorService);
        fixture = TestBed.createComponent(JudgeWaitingRoomComponent);
        component = fixture.componentInstance;
    });

    it('should handle api error with error service', async done => {
        spyOn(errorService, 'handleApiError').and.callFake(() => {
            Promise.resolve(true);
        });
        await component.getConference();
        expect(errorService.handleApiError).toHaveBeenCalled();
        done();
    });
});
