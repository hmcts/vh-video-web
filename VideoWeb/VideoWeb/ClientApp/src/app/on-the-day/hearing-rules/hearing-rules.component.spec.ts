import { convertToParamMap, Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { HearingRulesComponent } from './hearing-rules.component';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { BehaviorSubject } from 'rxjs';

describe('HearingRulesComponent', () => {
    let component: HearingRulesComponent;
    const conference = new ConferenceTestData().getConferenceDetailNow();

    let router: jasmine.SpyObj<Router>;
    const activatedRoute: any = { snapshot: { paramMap: convertToParamMap({ conferenceId: conference.id }) } };

    let participantStatusUpdateService: jasmine.SpyObj<ParticipantStatusUpdateService>;

    let mockedHearingVenueFlagsService: jasmine.SpyObj<HearingVenueFlagsService>;

    let scottishHearingVenueSubject = new BehaviorSubject(false);

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
        participantStatusUpdateService = jasmine.createSpyObj('ParticipantStatusUpdateService', ['postParticipantStatus']);
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
        component = new HearingRulesComponent(
            router,
            activatedRoute,
            participantStatusUpdateService,
            new MockLogger(),
            mockedHearingVenueFlagsService
        );
        router.navigate.calls.reset();
        component.ngOnInit();
    });

    it('should define conferece id on init ', () => {
        component.conferenceId = null;
        component.ngOnInit();
        expect(component.conferenceId).toBe(conference.id);
    });

    it('should navigate to declaration', () => {
        component.goToDeclaration();
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.Declaration, conference.id]);
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
