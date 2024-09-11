import { fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceStatus, LoggedParticipantResponse, Role, UserProfileResponse } from 'src/app/services/clients/api-client';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ScreenHelper } from 'src/app/shared/screen-helper';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import {
    eventsServiceSpy,
    getEndpointsUpdatedMessageSubjectMock,
    getHearingCancelledMock,
    getHearingDetailsUpdatedMock,
    getNewConferenceAddedMock,
    hearingStatusSubjectMock
} from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { HostHearingListBaseComponentDirective } from './host-hearing-list.component-base';

class MockedHearingListComponent extends HostHearingListBaseComponentDirective {
    retrieveHearingsForUser() {}
}

describe('JudgeHearingListComponent', () => {
    let component: HostHearingListBaseComponentDirective;

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
    let router: jasmine.SpyObj<Router>;
    let profileService: jasmine.SpyObj<ProfileService>;
    const logger: Logger = new MockLogger();

    const eventsService = eventsServiceSpy;

    beforeAll(() => {
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferencesForJudge', 'getCurrentParticipant']);

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
        component = new MockedHearingListComponent(
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

    it('re sets hearing venue flag to false ', () => {
        component.ngOnInit();
        expect(mockedHearingVenueFlagsService.setHearingVenueIsScottish).toHaveBeenCalledWith(false);
    });

    it('calls the retrieveHearingsForUser and sets up subscriptions on init', () => {
        spyOn(component, 'retrieveHearingsForUser');
        component.ngOnInit();

        expect(component.retrieveHearingsForUser).toHaveBeenCalledTimes(1);
        expect(eventsServiceSpy.getNewConferenceAdded).toHaveBeenCalled();
        expect(eventsServiceSpy.getHearingCancelled).toHaveBeenCalled();
        expect(eventsServiceSpy.getHearingDetailsUpdated).toHaveBeenCalled();
        expect(eventsServiceSpy.getParticipantsUpdated).toHaveBeenCalled();
        expect(eventsServiceSpy.getEndpointsUpdated).toHaveBeenCalled();
    });

    it('should retrieve conferences when hearing events are emitted', () => {
        spyOn(component, 'retrieveHearingsForUser');
        component.setupSubscribers();

        getNewConferenceAddedMock.next();
        getHearingCancelledMock.next();
        getHearingDetailsUpdatedMock.next();
        getEndpointsUpdatedMessageSubjectMock.next();

        expect(component.retrieveHearingsForUser).toHaveBeenCalledTimes(4);
    });

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
        expect(component.courtName).toBe('');
    });

    it('should use profile display name if first name is null', async () => {
        const profile = mockProfile;
        profile.first_name = null;
        component.profile = profile;
        expect(component.courtName).toBe(`${profile.display_name}`);
    });

    it('should use profile display name if last name is null', async () => {
        const profile = mockProfile;
        profile.last_name = null;
        component.profile = profile;
        expect(component.courtName).toBe(`${profile.display_name}`);
    });

    it('should navigate to judge waiting room when conference is selected for user as a judge in the conference', fakeAsync(() => {
        const conference = conferences[0];
        const judge = conference.participants.find(x => x.role === Role.Judge);
        videoWebService.getCurrentParticipant.and.returnValue(Promise.resolve(new LoggedParticipantResponse({ participant_id: judge.id })));

        component.onConferenceSelected(conference);
        tick();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeWaitingRoom, conference.id]);
    }));

    it('calls setHearingVenueIsScottish service when the hearing venue is in scotland', fakeAsync(() => {
        const conference = new ConferenceTestData().getConferenceForHostResponse();
        const judge = conference.participants.find(x => x.role === Role.Judge);
        videoWebService.getCurrentParticipant.and.returnValue(Promise.resolve(new LoggedParticipantResponse({ participant_id: judge.id })));

        component.onConferenceSelected(conference);
        expect(mockedHearingVenueFlagsService.setHearingVenueIsScottish).toHaveBeenCalledWith(true);
    }));

    it('calls setHearingVenueIsScottish service when the hearing venue is not in scotland', fakeAsync(() => {
        const conference = new ConferenceTestData().getConferenceForHostResponse();
        conference.hearing_venue_is_scottish = false;
        const judge = conference.participants.find(x => x.role === Role.Judge);
        videoWebService.getCurrentParticipant.and.returnValue(Promise.resolve(new LoggedParticipantResponse({ participant_id: judge.id })));

        component.onConferenceSelected(conference);

        expect(mockedHearingVenueFlagsService.setHearingVenueIsScottish).toHaveBeenCalledWith(false);
    }));

    it('should navigate to panel member waiting room when conference is selected for user as a panel member in the conference', fakeAsync(() => {
        profileService.getUserProfile.and.returnValue(Promise.resolve(mockProfile));
        const conference = conferences[0];
        const part = conference.participants.find(x => x.role === Role.JudicialOfficeHolder);
        videoWebService.getCurrentParticipant.and.returnValue(Promise.resolve(new LoggedParticipantResponse({ participant_id: part.id })));
        component.onConferenceSelected(conference);
        tick();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JOHWaitingRoom, conference.id]);
    }));

    it('should update conference status when message arrives', () => {
        const conference = conferences[0];
        const message = new ConferenceStatusMessage(conference.id, ConferenceStatus.Closed);
        component.setupSubscribers();

        hearingStatusSubjectMock.next(message);

        const updatedConference = component.conferences.find(x => x.id === conference.id);
        expect(updatedConference.status).toBe(message.status);

        // clear up
        component.eventHubSubscriptions.unsubscribe();
    });

    it('should navigate to equipment check', () => {
        component.goToEquipmentCheck();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.EquipmentCheck]);
    });

    it('should remove fullscreen and clear subscriptions on destroy', () => {
        component.conferencesSubscription = new Subscription();
        component.eventHubSubscriptions = new Subscription();
        component.ngOnDestroy();

        expect(screenHelper.enableFullScreen).toHaveBeenCalledWith(false);
    });
});
