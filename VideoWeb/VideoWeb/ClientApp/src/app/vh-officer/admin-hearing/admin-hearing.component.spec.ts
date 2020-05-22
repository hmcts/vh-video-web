import { DomSanitizer } from '@angular/platform-browser';
import { Hearing } from 'src/app/shared/models/hearing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { AdminHearingComponent } from './admin-hearing.component';

describe('AdminHearingComponent', () => {
    let component: AdminHearingComponent;
    let domSanitizerSpy: jasmine.SpyObj<DomSanitizer>;
    const conferenceDetail = new ConferenceTestData().getConferenceDetailFuture();
    const hearing = new Hearing(conferenceDetail);
    beforeAll(() => {
        domSanitizerSpy = jasmine.createSpyObj<DomSanitizer>('DomSanitizer', ['bypassSecurityTrustResourceUrl']);
        domSanitizerSpy.bypassSecurityTrustResourceUrl.and.returnValue('test-url');
    });

    beforeEach(() => {
        component = new AdminHearingComponent(domSanitizerSpy);
        component.hearing = hearing;
    });

    it('should sanitise iframe uri on init', () => {
        component.ngOnInit();
        expect(component.adminIframeUrl).toBe('test-url');
    });
});
