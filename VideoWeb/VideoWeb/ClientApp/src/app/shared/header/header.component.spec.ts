import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';
import { pageUrls } from '../page-url.constants';
import { HeaderComponent } from './header.component';
import { topMenuItems } from './topMenuItems';

describe('HeaderComponent', () => {
    let component: HeaderComponent;
    let router: jasmine.SpyObj<Router>;

    beforeAll(() => {
        router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
    });

    beforeEach(() => {
        component = new HeaderComponent(router);
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

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            declarations: [HeaderComponent, TranslatePipeMock]
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
});
