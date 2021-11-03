import { convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';
import { ConferenceLite } from 'src/app/services/models/conference-lite';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { IntroductionComponent } from './introduction.component';

describe('IntroductionComponent', () => {
    let component: IntroductionComponent;

    const conference = new ConferenceTestData().getConferenceDetailNow();
    const confLite = new ConferenceLite(conference.id, conference.case_number);

    let router: jasmine.SpyObj<Router>;
    const activatedRoute: any = { snapshot: { paramMap: convertToParamMap({ conferenceId: conference.id }) } };
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;

    let participantStatusUpdateService: jasmine.SpyObj<ParticipantStatusUpdateService>;
    participantStatusUpdateService = jasmine.createSpyObj('ParticipantStatusUpdateService', ['postParticipantStatus']);

    let mockedHearingVenueFlagsService: jasmine.SpyObj<HearingVenueFlagsService>;

    let scottishHearingVenueSubject = new BehaviorSubject(false);

    beforeAll(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getActiveIndividualConference']);

        videoWebServiceSpy.getActiveIndividualConference.and.returnValue(confLite);
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    });

    beforeEach(() => {
        mockedHearingVenueFlagsService = jasmine.createSpyObj<HearingVenueFlagsService>(
            'HearingVenueFlagsService',
            ['setHearingVenueIsScottish'],
            ['hearingVenueIsScottish$']
        );
        getSpiedPropertyGetter(mockedHearingVenueFlagsService, 'hearingVenueIsScottish$').and.returnValue(
            scottishHearingVenueSubject.asObservable()
        );

        component = new IntroductionComponent(
            router,
            activatedRoute,
            videoWebServiceSpy,
            participantStatusUpdateService,
            new MockLogger(),
            mockedHearingVenueFlagsService
        );
        router.navigate.calls.reset();
        component.ngOnInit();
    });

    it('should define conferece id on init', () => {
        component.conferenceId = null;
        component.ngOnInit();
        expect(component.conferenceId).toBe(conference.id);
    });
    it('should navigate to equipment check', () => {
        component.goToEquipmentCheck();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.EquipmentCheck, conference.id]);
    });

    it('returns true for hearingVenueIsInScotland when hearing venue is in scotland', () => {
        scottishHearingVenueSubject.next(true);
        expect(component.hearingVenueIsInScotland).toBe(true);
    });

    it('unsubscribes on destroy', () => {
        component.ngOnDestroy();
        expect(component.hearingVenueFlagsServiceSubscription$.closed).toBeTruthy();
    });
});
