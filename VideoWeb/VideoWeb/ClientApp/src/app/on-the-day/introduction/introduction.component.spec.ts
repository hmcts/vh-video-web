import { convertToParamMap, Router } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceLite } from 'src/app/services/models/conference-lite';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { IntroductionComponent } from './introduction.component';
import { of } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { UserProfileResponse, Role } from 'src/app/services/clients/api-client';
import { createMockStore, MockStore } from '@ngrx/store/testing';
import { mapConferenceToVHConference } from '../../waiting-space/store/models/api-contract-to-state-model-mappers';
import { ConferenceState } from '../../waiting-space/store/reducers/conference.reducer';
import * as ConferenceSelectors from '../../waiting-space/store/selectors/conference.selectors';

describe('IntroductionComponent', () => {
    let component: IntroductionComponent;

    const conference = new ConferenceTestData().getConferenceDetailNow();
    const confLite = new ConferenceLite(conference.id, conference.case_number);

    let mockConferenceStore: MockStore<ConferenceState>;
    let router: jasmine.SpyObj<Router>;
    const activatedRoute: any = { snapshot: { paramMap: convertToParamMap({ conferenceId: conference.id }) } };
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let profilesServiceSpy: jasmine.SpyObj<ProfileService>;

    const participantStatusUpdateService = jasmine.createSpyObj('ParticipantStatusUpdateService', ['postParticipantStatus']);

    beforeAll(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getActiveIndividualConference',
            'checkUserHasCompletedSelfTest'
        ]);

        const profile = new UserProfileResponse({ roles: [Role.Individual] });
        profilesServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['getUserProfile']);
        profilesServiceSpy.getUserProfile.and.returnValue(Promise.resolve(profile));
        videoWebServiceSpy.getActiveIndividualConference.and.returnValue(confLite);
        videoWebServiceSpy.checkUserHasCompletedSelfTest.and.returnValue(of(false));
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    });

    beforeEach(() => {
        const testData = new ConferenceTestData();
        const testConference = mapConferenceToVHConference(testData.getConferenceDetailNow());
        mockConferenceStore = createMockStore({
            initialState: { currentConference: mapConferenceToVHConference(conference), availableRooms: [] }
        });
        mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, testConference);
        mockConferenceStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, testConference.participants[0]);
        component = new IntroductionComponent(
            router,
            activatedRoute,
            videoWebServiceSpy,
            participantStatusUpdateService,
            new MockLogger(),
            mockConferenceStore
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

    it('should navigate to hearing rules', () => {
        component.skipToCourtRulesPage();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.HearingRules, conference.id]);
    });
});
