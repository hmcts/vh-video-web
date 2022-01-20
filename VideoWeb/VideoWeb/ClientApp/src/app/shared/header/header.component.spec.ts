import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';
import { getSpiedPropertyGetter } from '../jasmine-helpers/property-helpers';
import { pageUrls } from '../page-url.constants';
import { HeaderComponent } from './header.component';
import { topMenuItems } from './topMenuItems';

describe('HeaderComponent', () => {
    let component: HeaderComponent;
    let router: jasmine.SpyObj<Router>;
    let mockedHearingVenueFlagsService: jasmine.SpyObj<HearingVenueFlagsService>;

    const scottishHearingVenueSubject = new BehaviorSubject(false);

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
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
        component = new HeaderComponent(router, mockedHearingVenueFlagsService);
    });

    it('returns true for hearingVenueIsInScotland when hearing venue is in scotland', done => {
        scottishHearingVenueSubject.next(true);
        component.ngOnInit();
        component.hearingVenueIsScottish$.subscribe(scottishVenueFlag => {
            expect(scottishVenueFlag).toBe(true);
            done();
        });
    });

    it('header component should have top menu items', () => {
        component.ngOnInit();
        expect(component.topMenuItems).toEqual(topMenuItems);
    });

    it('selected top menu item has active property set to true, others item active set to false', () => {
        component.ngOnInit();
        component.selectMenuItem(0);
        expect(component.topMenuItems[0].active).toBeTruthy();
        if (component.topMenuItems.length > 1) {
            for (const item of component.topMenuItems.slice(1)) {
                expect(item.active).toBeFalsy();
            }
        }
    });

    it('user should navigate by selecting top meny item', () => {
        component.ngOnInit();
        component.selectMenuItem(0);
        expect(router.navigate).toHaveBeenCalledWith([component.topMenuItems[0].url]);
    });
});

describe('Header component template file', () => {
    let fixture: ComponentFixture<HeaderComponent>;
    let component: HeaderComponent;
    let debugElement: DebugElement;
    let mockedHearingVenueFlagsService: jasmine.SpyObj<HearingVenueFlagsService>;

    const scottishHearingVenueSubject = new BehaviorSubject(false);

    beforeEach(async () => {
        mockedHearingVenueFlagsService = jasmine.createSpyObj<HearingVenueFlagsService>(
            'HearingVenueFlagsService',
            ['setHearingVenueIsScottish'],
            ['hearingVenueIsScottish$']
        );
        getSpiedPropertyGetter(mockedHearingVenueFlagsService, 'hearingVenueIsScottish$').and.returnValue(
            scottishHearingVenueSubject.asObservable()
        );
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            declarations: [HeaderComponent, TranslatePipeMock],
            providers: [{ provide: HearingVenueFlagsService, useValue: mockedHearingVenueFlagsService }]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HeaderComponent);
        component = fixture.componentInstance;
        debugElement = fixture.debugElement;
    });

    it('logout button should route to logout page', () => {
        component.loggedIn = true;

        fixture.detectChanges();

        const logoutButton = debugElement.query(By.css('#logout-link'));

        expect(logoutButton.nativeElement.pathname).toBe(`/${pageUrls.Logout}`);
    });

    it('hides logout button when logged in is false', () => {
        component.loggedIn = false;

        fixture.detectChanges();

        const logoutButton = debugElement.query(By.css('#logout-link'));

        expect(logoutButton).toBeNull();
    });

    it('renders scottish logo when hearing venue is scottish', () => {
        scottishHearingVenueSubject.next(true);

        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('#header-logo-scot'))).toBeTruthy();
    });

    it('renders uk logo when hearing venue is not scottish', () => {
        scottishHearingVenueSubject.next(false);

        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('#header-logo-scot'))).toBeFalsy();
    });
});
