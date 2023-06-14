import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Role, UserProfileResponse } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { ScreenHelper } from 'src/app/shared/screen-helper';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';

import { StaffMemberHearingListComponent } from './staff-member-hearing-list.component';
import { pageUrls } from 'src/app/shared/page-url.constants';

describe('StaffMemberHearingListComponent', () => {
    let component: StaffMemberHearingListComponent;

    const mockProfile: UserProfileResponse = new UserProfileResponse({
        display_name: 'John Doe',
        first_name: 'John',
        last_name: 'Doe',
        roles: [Role.Judge]
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
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getConferencesForStaffMember',
            'getCurrentParticipant',
            'staffMemberJoinConference',
            'getConferenceById'
        ]);

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
        component = new StaffMemberHearingListComponent(
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

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('updates conferences when judge has conferences', fakeAsync(() => {
        videoWebService.getConferencesForStaffMember.and.returnValue(of(conferences));

        component.retrieveHearingsForUser();
        flushMicrotasks();

        expect(component.loadingData).toBe(false);
        expect(component.conferences).toBe(conferences);
        expect(screenHelper.enableFullScreen).toHaveBeenCalledWith(true);
    }));

    it('should handle api error with error service when unable to retrieve hearings for judge', fakeAsync(() => {
        videoWebService.getConferencesForStaffMember.and.returnValue(throwError({ status: 401, isApiException: true }));
        component.retrieveHearingsForUser();
        expect(component.loadingData).toBe(false);
        expect(errorService.handleApiError).toHaveBeenCalled();
    }));

    it('should navigate to staff waiting room when conference is selected for user as a staffmember in the conference', fakeAsync(() => {
        const conference = new ConferenceTestData().getConferenceForHostResponse();
        const staffMember = conference.participants.find(x => x.role === Role.StaffMember);
        router.navigate.calls.reset();
        profileService.getUserProfile.and.returnValue(Promise.resolve(staffMember));
        videoWebService.getConferenceById.and.returnValue(Promise.resolve(conference));
        videoWebService.staffMemberJoinConference.and.returnValue(Promise.resolve(conference));
        component.onConferenceSelected(conference);
        tick();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.StaffMemberWaitingRoom, conference.id]);
    }));

    it('should show no hearings message when judge has no conferences', fakeAsync(() => {
        videoWebService.getConferencesForStaffMember.and.returnValue(of([]));

        component.retrieveHearingsForUser();
        flushMicrotasks();

        expect(component.hasHearings()).toBe(false);
        expect(screenHelper.enableFullScreen).toHaveBeenCalledTimes(0);
    }));
});
