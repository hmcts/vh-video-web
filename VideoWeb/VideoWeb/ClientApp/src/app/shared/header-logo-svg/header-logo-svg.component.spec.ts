import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';
import { getSpiedPropertyGetter } from '../jasmine-helpers/property-helpers';

import { HeaderLogoSvgComponent } from './header-logo-svg.component';

describe('HeaderLogoSvgComponent', () => {
    let component: HeaderLogoSvgComponent;
    let fixture: ComponentFixture<HeaderLogoSvgComponent>;
    let mockedHearingVenueFlagsService: jasmine.SpyObj<HearingVenueFlagsService>;
    let hearingVenueIsScottishSubject: BehaviorSubject<boolean>;

    beforeEach(async () => {
        mockedHearingVenueFlagsService = jasmine.createSpyObj<HearingVenueFlagsService>(
            'HearingVenueFlagsService',
            ['setHearingVenueIsScottish'],
            ['hearingVenueIsScottish$']
        );
        hearingVenueIsScottishSubject = new BehaviorSubject(false);
        getSpiedPropertyGetter(mockedHearingVenueFlagsService, 'hearingVenueIsScottish$').and.returnValue(hearingVenueIsScottishSubject);
        await TestBed.configureTestingModule({
            declarations: [HeaderLogoSvgComponent, TranslatePipeMock],
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
        hearingVenueIsScottishSubject.next(true);
        expect(component.hearingVenueIsInScotland).toBe(true);
    });

    it('unsubscribes on destroy', () => {
        component.ngOnDestroy();

        expect(component.hearingVenueFlagsServiceSubscription.closed).toBeTruthy();
    });

    it('renders scottish logo when hearing venue is scottish', () => {
        hearingVenueIsScottishSubject.next(true);

        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('#header-logo-scot'))).toBeTruthy();
        expect(fixture.debugElement.query(By.css('#header-logo-uk'))).toBeFalsy();
    });

    it('renders uk logo when hearing venue is not scottish', () => {
        hearingVenueIsScottishSubject.next(false);

        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('#header-logo-scot'))).toBeFalsy();
        expect(fixture.debugElement.query(By.css('#header-logo-uk'))).toBeTruthy();
    });
});
