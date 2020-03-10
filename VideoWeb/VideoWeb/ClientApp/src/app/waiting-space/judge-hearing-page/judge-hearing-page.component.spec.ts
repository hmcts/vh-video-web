import { JudgeHearingPageComponent } from './judge-hearing-page.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { ConferenceResponse, ConferenceStatus } from 'src/app/services/clients/api-client';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockEventsNonHttpService, MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { configureTestSuite } from 'ng-bullet';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { SharedModule } from 'src/app/shared/shared.module';
import { RouterTestingModule } from '@angular/router/testing';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { AdalService } from 'adal-angular4';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { PageUrls } from 'src/app/shared/page-url.constants';

describe('JudgeHearingPageComponent when conference in session', () => {
    let component: JudgeHearingPageComponent;
    let fixture: ComponentFixture<JudgeHearingPageComponent>;
    const videoWebServiceMock = new MockVideoWebService();
    let router: Router;
    let conference: ConferenceResponse;
    let adalService: MockAdalService;
    let eventService: MockEventsNonHttpService;

    configureTestSuite(() => {
        conference = new ConferenceTestData().getConferenceDetailFuture();

        TestBed.configureTestingModule({
            imports: [SharedModule, RouterTestingModule],
            declarations: [JudgeHearingPageComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: convertToParamMap({ conferenceId: conference.id })
                        }
                    }
                },
                { provide: VideoWebService, useValue: videoWebServiceMock },
                { provide: AdalService, useClass: MockAdalService },
                { provide: EventsService, useClass: MockEventsService },
                { provide: Logger, useClass: MockLogger }
            ]
        });
    });

    beforeEach(async () => {
        adalService = TestBed.get(AdalService);
        eventService = TestBed.get(EventsService);
        router = TestBed.get(Router);
        fixture = TestBed.createComponent(JudgeHearingPageComponent);
        component = fixture.componentInstance;
        component.conference = conference;

        spyOn(component, 'sanitiseIframeUrl').and.callFake(() => {});
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should send judge to hearing list when conference is closed', () => {
        spyOn(router, 'navigate').and.callFake(() => {
            Promise.resolve(true);
        });
        conference.status = ConferenceStatus.Closed;
        component.determineJudgeLocation();
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.JudgeHearingList]);
    });

    it('should send judge to waiting room when conference is suspended', () => {
        spyOn(router, 'navigate').and.callFake(() => {
            Promise.resolve(true);
        });
        spyOn(component, 'judgeURLChanged').and.callFake(() => {});
        const status = ConferenceStatus.Suspended;
        component.handleHearingStatusChange(status);
        expect(component.conference.status).toBe(status);
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.JudgeWaitingRoom, conference.id]);
    });

    it('should send judge to waiting room when conference is paused', () => {
        spyOn(router, 'navigate').and.callFake(() => {
            Promise.resolve(true);
        });
        spyOn(component, 'judgeURLChanged').and.callFake(() => {});
        const status = ConferenceStatus.Paused;
        component.handleHearingStatusChange(status);
        expect(component.conference.status).toBe(status);
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.JudgeWaitingRoom, conference.id]);
    });
});
