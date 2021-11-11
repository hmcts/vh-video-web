import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Role, UserProfileResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { ScreenHelper } from 'src/app/shared/screen-helper';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
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
    let mockedHearingVenueFlagsService: jasmine.SpyObj<HearingVenueFlagsService>;
    let hearingVenueIsScottishSubject: BehaviorSubject<boolean>;
    let screenHelper: jasmine.SpyObj<ScreenHelper>;
    let errorService: jasmine.SpyObj<ErrorService>;
    let router: jasmine.SpyObj<Router>;
    let profileService: jasmine.SpyObj<ProfileService>;
    const logger: Logger = new MockLogger();

    const eventsService = eventsServiceSpy;

    beforeAll(() => {
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferencesForJudge', 'getCurrentParticipant']);

        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', [
            'goToServiceError',
            'handleApiError',
            'returnHomeIfUnauthorised'
        ]);

        profileService = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);

        profileService.getUserProfile.and.returnValue(Promise.resolve(mockProfile));

        router = jasmine.createSpyObj<Router>('Router', ['navigate']);

        screenHelper = jasmine.createSpyObj<ScreenHelper>('ScreenHelper', ['enableFullScreen']);
    });

    beforeEach(() => {
        mockedHearingVenueFlagsService = jasmine.createSpyObj<HearingVenueFlagsService>(
            'HearingVenueFlagsService',
            ['setHearingVenueIsScottish'],
            ['hearingVenueIsScottish$']
        );
        hearingVenueIsScottishSubject = new BehaviorSubject(false);
        getSpiedPropertyGetter(mockedHearingVenueFlagsService, 'hearingVenueIsScottish$').and.returnValue(hearingVenueIsScottishSubject);
        component = new JudgeHearingListComponent(
            errorService,
            videoWebService,
            router,
            profileService,
            logger,
            eventsService,
            screenHelper,
            mockedHearingVenueFlagsService
        );
        component.conferences = conferences;
        screenHelper.enableFullScreen.calls.reset();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('updates conferences when judge has conferences', fakeAsync(() => {
        videoWebService.getConferencesForJudge.and.returnValue(of(conferences));

        component.retrieveHearingsForUser();
        flushMicrotasks();

        expect(component.loadingData).toBe(false);
        expect(component.conferences).toBe(conferences);
        expect(screenHelper.enableFullScreen).toHaveBeenCalledWith(true);
    }));

    it('should handle api error with error service when unable to retrieve hearings for judge', fakeAsync(() => {
        videoWebService.getConferencesForJudge.and.returnValue(throwError({ status: 401, isApiException: true }));
        component.retrieveHearingsForUser();
        expect(component.loadingData).toBe(false);
        expect(errorService.handleApiError).toHaveBeenCalled();
    }));

    it('should show no hearings message when judge has no conferences', fakeAsync(() => {
        videoWebService.getConferencesForJudge.and.returnValue(of([]));

        component.retrieveHearingsForUser();
        flushMicrotasks();

        expect(component.hasHearings()).toBe(false);
        expect(screenHelper.enableFullScreen).toHaveBeenCalledTimes(0);
    }));
});
