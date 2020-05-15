import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { configureTestSuite } from 'ng-bullet';
import { of, throwError } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { MockProfileService } from 'src/app/testing/mocks/MockProfileService';
import { JudgeHearingTableStubComponent } from 'src/app/testing/stubs/judge-hearing-list-table-stub';
import { ConferenceForJudgeResponse, ConferenceStatus } from '../../services/clients/api-client';
import { JudgeHearingListComponent } from './judge-hearing-list.component';

describe('JudgeHearingListComponent with no conferences for user', () => {
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let component: JudgeHearingListComponent;
    let fixture: ComponentFixture<JudgeHearingListComponent>;
    const noConferences: ConferenceForJudgeResponse[] = [];

    configureTestSuite(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getConferencesForJudge',
            'getConferenceById',
            'raiseParticipantEvent'
        ]);
        videoWebServiceSpy.getConferencesForJudge.and.returnValue(of(noConferences));
        videoWebServiceSpy.raiseParticipantEvent.and.returnValue(Promise.resolve());

        TestBed.configureTestingModule({
            imports: [RouterTestingModule, SharedModule],
            declarations: [JudgeHearingListComponent, JudgeHearingTableStubComponent],
            providers: [
                { provide: VideoWebService, useValue: videoWebServiceSpy },
                { provide: ProfileService, useClass: MockProfileService },
                { provide: Logger, useClass: MockLogger },
                { provide: EventsService, useClass: MockEventsService }
            ]
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(JudgeHearingListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should show no hearings message', () => {
        expect(component.hasHearings()).toBeFalsy();
    });
});

describe('JudgeHearingListComponent with conferences for user', () => {
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let component: JudgeHearingListComponent;
    let fixture: ComponentFixture<JudgeHearingListComponent>;
    const conferences = new ConferenceTestData().getTestData();
    let router: Router;
    let profileService: MockProfileService;

    configureTestSuite(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getConferencesForJudge',
            'getConferenceById',
            'raiseParticipantEvent'
        ]);
        videoWebServiceSpy.getConferencesForJudge.and.returnValue(of(conferences));
        videoWebServiceSpy.raiseParticipantEvent.and.returnValue(Promise.resolve());

        TestBed.configureTestingModule({
            imports: [SharedModule, RouterTestingModule],
            declarations: [JudgeHearingListComponent, JudgeHearingTableStubComponent],
            providers: [
                { provide: VideoWebService, useValue: videoWebServiceSpy },
                { provide: ProfileService, useClass: MockProfileService },
                { provide: Logger, useClass: MockLogger },
                { provide: EventsService, useClass: MockEventsService }
            ]
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(JudgeHearingListComponent);
        component = fixture.componentInstance;
        router = TestBed.get(Router);
        profileService = TestBed.get(ProfileService);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should list hearings', () => {
        expect(component.hasHearings()).toBeTruthy();
    });

    it('should have profile name as the court name', async () => {
        const profile = profileService.mockProfile;
        component.profile = profile;
        expect(component.courtName).toBe(`${profile.first_name}, ${profile.last_name}`);
    });

    it('should navigate to judge waiting room when conference is selected', () => {
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
        const conference = conferences[0];
        component.onConferenceSelected(conference);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeWaitingRoom, conference.id]);
    });

    it('should update conference status when message arrives', () => {
        const eventsService: MockEventsService = TestBed.get(EventsService);
        const conference = conferences[0];
        const message = new ConferenceStatusMessage(conference.id, ConferenceStatus.Closed);
        eventsService.hearingStatusSubject.next(message);
        const updatedConference = component.conferences.find(x => x.id === conference.id);
        expect(updatedConference.status).toBe(message.status);
    });

    it('should navigate to equipment check', () => {
        spyOn(router, 'navigate');
        component.goToEquipmentCheck();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.EquipmentCheck]);
    });
});

describe('JudgeHearingListComponent with service error', () => {
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let component: JudgeHearingListComponent;
    let fixture: ComponentFixture<JudgeHearingListComponent>;
    let errorService: ErrorService;

    configureTestSuite(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getConferencesForJudge',
            'getConferenceById',
            'raiseParticipantEvent'
        ]);
        videoWebServiceSpy.getConferencesForJudge.and.returnValue(throwError({ status: 401, isApiException: true }));
        videoWebServiceSpy.raiseParticipantEvent.and.returnValue(Promise.resolve());

        TestBed.configureTestingModule({
            imports: [SharedModule, RouterTestingModule],
            declarations: [JudgeHearingListComponent, JudgeHearingTableStubComponent],
            providers: [
                { provide: VideoWebService, useValue: videoWebServiceSpy },
                { provide: ProfileService, useClass: MockProfileService },
                { provide: Logger, useClass: MockLogger },
                { provide: EventsService, useClass: MockEventsService }
            ]
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(JudgeHearingListComponent);
        component = fixture.componentInstance;
        errorService = TestBed.get(ErrorService);
    });

    it('should handle api error with error service', () => {
        spyOn(errorService, 'handleApiError').and.callFake(() => {
            Promise.resolve(true);
        });
        fixture.detectChanges();
        expect(component).toBeTruthy();
        expect(component.loadingData).toBeFalsy();
        expect(errorService.handleApiError).toHaveBeenCalled();
    });
});
