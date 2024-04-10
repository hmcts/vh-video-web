import { DomSanitizer } from '@angular/platform-browser';
import { Hearing } from 'src/app/shared/models/hearing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { AdminHearingComponent } from './admin-hearing.component';
import { FEATURE_FLAGS, LaunchDarklyService } from "../../services/launch-darkly.service";
import { Observable, of } from "rxjs";

describe('AdminHearingComponent', () => {
    let component: AdminHearingComponent;
    let domSanitizerSpy: jasmine.SpyObj<DomSanitizer>;
    let ldServiceSpy: jasmine.SpyObj<LaunchDarklyService>;
    const conferenceDetail = new ConferenceTestData().getConferenceDetailFuture();
    const hearing = new Hearing(conferenceDetail);
    beforeAll(() => {
        domSanitizerSpy = jasmine.createSpyObj<DomSanitizer>('DomSanitizer', ['bypassSecurityTrustResourceUrl']);
        domSanitizerSpy.bypassSecurityTrustResourceUrl.and.returnValue('test-url');
        ldServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
    });

    beforeEach(() => {
        component = new AdminHearingComponent(domSanitizerSpy, ldServiceSpy);
        component.hearing = hearing;
    });

    it('should sanitise iframe uri on init', () => {
        ldServiceSpy.getFlag.withArgs(FEATURE_FLAGS.vodafone, jasmine.any(Boolean)).and.returnValue(of(false));
        component.ngOnInit();
        expect(component.adminIframeUrl).toBe('test-url');
    });

    it('should set to false the toggle when flag is off', () => {
        ldServiceSpy.getFlag.withArgs(FEATURE_FLAGS.vodafone, jasmine.any(Boolean)).and.returnValue(of(false));
        component.ngOnInit();
        expect(component.vhoVodafoneFeatureFlag).toBeFalsy();
    });

    it('should set to false the toggle when flag is on', () => {
        ldServiceSpy.getFlag.withArgs(FEATURE_FLAGS.vodafone, jasmine.any(Boolean)).and.returnValue(of(true));
        component.ngOnInit();
        expect(component.vhoVodafoneFeatureFlag).toBeTruthy();
    });
});
