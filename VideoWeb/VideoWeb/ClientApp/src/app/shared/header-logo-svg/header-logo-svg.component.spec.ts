import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';
import { getSpiedPropertyGetter } from '../jasmine-helpers/property-helpers';

import { HeaderLogoSvgComponent } from './header-logo-svg.component';

describe('HeaderLogoSvgComponent', () => {
    let component: HeaderLogoSvgComponent;
    let fixture: ComponentFixture<HeaderLogoSvgComponent>;
    let mockedHearingVenueFlagsService: jasmine.SpyObj<HearingVenueFlagsService>;

    beforeEach(async () => {
        mockedHearingVenueFlagsService = jasmine.createSpyObj<HearingVenueFlagsService>(
            'HearingVenueFlagsService',
            [],
            ['HearingVenueIsScottish']
        );
        getSpiedPropertyGetter(mockedHearingVenueFlagsService, 'HearingVenueIsScottish').and.returnValue(new BehaviorSubject(false));
        await TestBed.configureTestingModule({
            declarations: [HeaderLogoSvgComponent],
            providers: [{ provide: HearingVenueFlagsService, useValue: mockedHearingVenueFlagsService }]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HeaderLogoSvgComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('returns true for hearingVenueIsInScotland when hearing venue is in scotland', () => {
        getSpiedPropertyGetter(mockedHearingVenueFlagsService, 'HearingVenueIsScottish').and.returnValue(new BehaviorSubject(true));
        component.ngOnInit();

        expect(component.hearingVenueIsInScotland).toBe(true);
    });

    it('unsubscribes on destroy', () => {
        component.ngOnDestroy();

        expect(component.hearingVenueFlagsServiceSubscription.closed).toBeTruthy();
    });

    it('renders scottish logo when hearing venue is scottish', () => {
        getSpiedPropertyGetter(mockedHearingVenueFlagsService, 'HearingVenueIsScottish').and.returnValue(new BehaviorSubject(true));
        component.ngOnInit();
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('#header-logo-scot'))).toBeTruthy();
        expect(fixture.debugElement.query(By.css('#header-logo-uk'))).toBeFalsy();
    });

    it('renders uk logo when hearing venue is not scottish', () => {
        getSpiedPropertyGetter(mockedHearingVenueFlagsService, 'HearingVenueIsScottish').and.returnValue(new BehaviorSubject(false));
        component.ngOnInit();
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('#header-logo-scot'))).toBeFalsy();
        expect(fixture.debugElement.query(By.css('#header-logo-uk'))).toBeTruthy();
    });
});
