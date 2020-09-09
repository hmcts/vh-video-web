import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subscription, throwError } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ScreenHelper } from 'src/app/shared/screen-helper';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { ConferenceStatus, Role, UserProfileResponse } from '../../services/clients/api-client';
import { JudgeHearingListComponent } from './judge-hearing-list.component';

describe('JudgeHearingListComponent', () => {
    let component: JudgeHearingListComponent;

    const mockProfile: UserProfileResponse = new UserProfileResponse({
        display_name: 'John Doe',
        first_name: 'John',
        last_name: 'Doe',
        role: Role.Judge
    });

    const conferences = new ConferenceTestData().getTestData();

    let videoWebService: jasmine.SpyObj<VideoWebService>;
    let screenHelper: jasmine.SpyObj<ScreenHelper>;
    let errorService: jasmine.SpyObj<ErrorService>;
    let router: jasmine.SpyObj<Router>;
    let profileService: jasmine.SpyObj<ProfileService>;
    const logger: Logger = new MockLogger();

    let eventsService: jasmine.SpyObj<EventsService>;
    const mockEventService = new MockEventsService();

    beforeAll(() => {
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferencesForJudge']);

        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', [
            'goToServiceError',
            'handleApiError',
            'returnHomeIfUnauthorised'
        ]);

        profileService = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);

        profileService.getUserProfile.and.returnValue(Promise.resolve(mockProfile));

        router = jasmine.createSpyObj<Router>('Router', ['navigate']);

        eventsService = jasmine.createSpyObj<EventsService>('EventsService', ['start', 'getHearingStatusMessage']);
        eventsService.getHearingStatusMessage.and.returnValue(mockEventService.hearingStatusSubject.asObservable());

        screenHelper = jasmine.createSpyObj<ScreenHelper>('ScreenHelper', ['enableFullScreen']);
    });

    beforeEach(() => {
        component = new JudgeHearingListComponent(
            videoWebService,
            errorService,
            router,
            profileService,
            logger,
            eventsService,
            screenHelper
        );
        component.conferences = conferences;
        videoWebService.getConferencesForJudge.and.returnValue(of(conferences));

        screenHelper.enableFullScreen.calls.reset();
    });

    it('should handle api error with error service when unable to retrieve hearings for judge', fakeAsync(() => {
        videoWebService.getConferencesForJudge.and.returnValue(throwError({ status: 401, isApiException: true }));
        component.retrieveHearingsForUser();
        expect(component.loadingData).toBeFalsy();
        expect(errorService.handleApiError).toHaveBeenCalled();
    }));

    it('should show no hearings message when judge has no conferences', fakeAsync(() => {
        videoWebService.getConferencesForJudge.and.returnValue(of([]));

        component.retrieveHearingsForUser();
        flushMicrotasks();

        expect(component.hasHearings()).toBeFalsy();
        expect(screenHelper.enableFullScreen).toHaveBeenCalledTimes(0);
    }));

    it('should retrieve conferences and setup interval on init', fakeAsync(() => {
        component.conferences = null;
        const interval = jasmine.createSpyObj<NodeJS.Timeout>('NodeJS.Timeout', ['ref', 'unref']);
        spyOn(global, 'setInterval').and.returnValue(<any>interval);

        component.ngOnInit();
        flushMicrotasks();

        expect(screenHelper.enableFullScreen).toHaveBeenCalledWith(true);
        expect(component.profile).toBe(mockProfile);
        expect(component.conferences).toBe(conferences);
        expect(setInterval).toHaveBeenCalled();
        expect(component.interval).toBe(interval);
    }));

    it('should show hearings when judge has conferences', () => {
        component.conferences = conferences;
        expect(component.hasHearings()).toBeTruthy();
    });

    it('should have profile name as the court name', async () => {
        const profile = mockProfile;
        component.profile = profile;
        expect(component.courtName).toBe(`${profile.first_name}, ${profile.last_name}`);
    });

    it('should return a blank court name if no profile is loaded', async () => {
        const profile = null;
        component.profile = profile;
        expect(component.courtName).toBe(``);
    });

    it('should navigate to judge waiting room when conference is selected', () => {
        const conference = conferences[0];
        component.onConferenceSelected(conference);
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeWaitingRoom, conference.id]);
    });

    it('should update conference status when message arrives', () => {
        const conference = conferences[0];
        const message = new ConferenceStatusMessage(conference.id, ConferenceStatus.Closed);
        component.setupSubscribers();

        mockEventService.hearingStatusSubject.next(message);

        const updatedConference = component.conferences.find(x => x.id === conference.id);
        expect(updatedConference.status).toBe(message.status);

        // clear up
        component.eventHubSubscriptions.unsubscribe();
    });

    it('should navigate to equipment check', () => {
        component.goToEquipmentCheck();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.EquipmentCheck]);
    });

    it('should remove fullscreen, clear subscriptions and intervals on destroy', () => {
        spyOn(window, 'clearInterval');
        const interval = jasmine.createSpyObj<NodeJS.Timer>('NodeJS.Timer', ['ref', 'unref']);
        component.interval = interval;
        component.conferencesSubscription = new Subscription();
        component.eventHubSubscriptions = new Subscription();
        component.ngOnDestroy();

        expect(screenHelper.enableFullScreen).toHaveBeenCalledWith(false);
        expect(clearInterval).toHaveBeenCalledWith(interval);
    });
});
