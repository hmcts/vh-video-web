import { async, ComponentFixture, TestBed, tick, fakeAsync } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { ErrorComponent } from './error.component';
import { RouterTestingModule } from '@angular/router/testing';
import { ContactUsFoldingComponent } from '../contact-us-folding/contact-us-folding.component';
import { SessionStorage } from 'src/app/services/session-storage';
import { PageTrackerService } from 'src/app/services/page-tracker.service';
import { Observable } from 'rxjs';

class MockRouter {
    public ne = new NavigationEnd(0, '/testUrl', null);
    public ne1 = new NavigationEnd(1, '/testUrl1', '/testUrl1');
    public events = new Observable(observer => {
        observer.next(this.ne);
        observer.next(this.ne1);
        observer.complete();
    });
}

describe('ErrorComponent', () => {
    let component: ErrorComponent;
    let fixture: ComponentFixture<ErrorComponent>;

    let location: Location;
    let router: Router;
    let pageTrackerSpy: jasmine.SpyObj<PageTrackerService>;

    beforeEach(async(() => {
        pageTrackerSpy = jasmine.createSpyObj<PageTrackerService>(['trackNavigation', 'trackPreviousPage', 'getPreviousUrl']);
        pageTrackerSpy.getPreviousUrl.and.returnValue('testurl');

        TestBed.configureTestingModule({
            declarations: [ErrorComponent, ContactUsFoldingComponent],
            imports: [RouterTestingModule],
            providers: [{ provide: PageTrackerService, useValue: pageTrackerSpy }]
        }).compileComponents();
    }));

    beforeEach(() => {
        router = TestBed.get(Router);
        location = TestBed.get(Location);
        fixture = TestBed.createComponent(ErrorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should show default error message if session storage is empty', () => {
        const key = 'vh.error.message';
        const storedMessage = new SessionStorage<string>(key);
        storedMessage.clear();

        component.ngOnInit();
        expect(component.errorMessageText).toBe(null);
        expect(component.connectionError).toBeFalsy();
    });
    it('should show error message if session storage returns a value', () => {
        const key = 'vh.error.message';
        const storedMessage = new SessionStorage<string>(key);
        storedMessage.set('disconnected');

        component.ngOnInit();
        expect(component.errorMessageText).not.toBe(null);
        expect(component.connectionError).toBeTruthy();
    });
    it('should unsubscribe all subcriptions on destroy component', () => {
        component.ngOnDestroy();
        expect(component.subscription.closed).toBeTruthy();
    });
    it('should navigate to previous page on reconnect click', () => {
        component.reconnect();
        expect(pageTrackerSpy.getPreviousUrl).toHaveBeenCalled();
    });
});

describe('ErrorComponent Refresh', () => {
    let component: ErrorComponent;
    let fixture: ComponentFixture<ErrorComponent>;

    let location: Location;
    let router: Router;
    let pageTrackerSpy: jasmine.SpyObj<PageTrackerService>;

    beforeEach(() => {
        pageTrackerSpy = jasmine.createSpyObj<PageTrackerService>(['trackNavigation', 'trackPreviousPage', 'getPreviousUrl']);
        pageTrackerSpy.getPreviousUrl.and.returnValue('testurl');

        TestBed.configureTestingModule({
            declarations: [ErrorComponent, ContactUsFoldingComponent],
            imports: [RouterTestingModule],
            providers: [
                { provide: PageTrackerService, useValue: pageTrackerSpy },
                { provide: Router, useClass: MockRouter }
            ]
        }).compileComponents();
        router = TestBed.get(Router);
        location = TestBed.get(Location);
        fixture = TestBed.createComponent(ErrorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should not navigate back on timer page refresh', fakeAsync(() => {
        spyOn(location, 'back');
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        component.connectionError = true;
        expect(location.back).toHaveBeenCalledTimes(0);
    }));
});
