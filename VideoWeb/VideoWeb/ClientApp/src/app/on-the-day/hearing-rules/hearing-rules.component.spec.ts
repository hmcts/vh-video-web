import { convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { HearingRulesComponent } from './hearing-rules.component';

describe('HearingRulesComponent', () => {
    let component: HearingRulesComponent;
    const conference = new ConferenceTestData().getConferenceDetailNow();

    let router: jasmine.SpyObj<Router>;
    const activatedRoute: any = { snapshot: { paramMap: convertToParamMap({ conferenceId: conference.id }) } };

    let participantStatusUpdateService: jasmine.SpyObj<ParticipantStatusUpdateService>;

    let mockedHearingVenueFlagsService: jasmine.SpyObj<HearingVenueFlagsService>;

    const scottishHearingVenueSubject = new BehaviorSubject(false);

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

    it('returns true for hearingVenueIsInScotland when hearing venue is in scotland', done => {
        scottishHearingVenueSubject.next(true);
        component.hearingVenueIsScottish$.subscribe(scottishVenueFlag => {
            expect(scottishVenueFlag).toBe(true);
            done();
        });
    });
});
