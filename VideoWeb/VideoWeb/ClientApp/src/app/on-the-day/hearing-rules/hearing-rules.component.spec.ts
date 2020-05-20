import { convertToParamMap, Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { HearingRulesComponent } from './hearing-rules.component';

describe('HearingRulesComponent', () => {
    let component: HearingRulesComponent;
    const conference = new ConferenceTestData().getConferenceDetailNow();

    let router: jasmine.SpyObj<Router>;
    const activatedRoute: any = { snapshot: { paramMap: convertToParamMap({ conferenceId: conference.id }) } };

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    });

    beforeEach(() => {
        component = new HearingRulesComponent(router, activatedRoute);
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
});
