import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NavigationEnd, NavigationExtras, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable } from 'rxjs';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { PageTrackerService } from 'src/app/services/page-tracker.service';
import { SessionStorage } from 'src/app/services/session-storage';
import { eventsServiceSpy, isConnectedSpy } from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { ContactUsFoldingComponent } from '../contact-us-folding/contact-us-folding.component';
import { ErrorMessage } from '../models/error-message';
import { ErrorComponent } from './error.component';

class MockRouter {
    public ne = new NavigationEnd(0, '/testUrl-test-error1', null);
    public ne1 = new NavigationEnd(1, '/testUrl-test-error2', '/testUrl-test-error2');
    public events = new Observable(observer => {
        observer.next(this.ne);
        observer.next(this.ne1);
        observer.complete();
    });
    navigate(commands: any[], extras?: NavigationExtras): Promise<boolean> {
        return Promise.resolve(true);
    }
}

@Component({ selector: 'app-mock-component', template: '' })
class Mock1Component {}

@Component({ selector: 'app-mock-component2', template: '' })
class Mock2Component {}

let eventsService: jasmine.SpyObj<EventsService>;

describe('ErrorComponent', () => {
    let component: ErrorComponent;
    let fixture: ComponentFixture<ErrorComponent>;

    let router: Router;
    let pageTrackerSpy: jasmine.SpyObj<PageTrackerService>;

    beforeEach(
        waitForAsync(() => {
            eventsService = eventsServiceSpy;
            pageTrackerSpy = jasmine.createSpyObj<PageTrackerService>(['trackPreviousPage', 'getPreviousUrl']);
            pageTrackerSpy.getPreviousUrl.and.returnValue('testUrl-test-error1');

            TestBed.configureTestingModule({
                declarations: [ErrorComponent, ContactUsFoldingComponent, Mock1Component, Mock2Component],
                imports: [
                    RouterTestingModule.withRoutes([
                        { path: 'testUrl-test-error1', component: Mock1Component },
                        { path: 'testUrl-test-error2', component: Mock2Component }
                    ])
                ],
                providers: [
                    { provide: PageTrackerService, useValue: pageTrackerSpy },
                    { provide: EventsService, useValue: eventsService },
                    { provide: Logger, useClass: MockLogger }
                ]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        router = TestBed.inject(Router);
        fixture = TestBed.createComponent(ErrorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should show default error message if session storage is empty', () => {
        const key = 'vh.error.message';
        const storedMessage = new SessionStorage<ErrorMessage>(key);
        storedMessage.clear();

        component.ngOnInit();
        expect(component.errorMessageTitle).toBeUndefined();
        expect(component.errorMessageBody).toBe('Please reconnect. Call us if you keep seeing this message.');
        expect(component.connectionError).toBeFalsy();
    });
    it('should show error message if session storage returns a value', () => {
        const key = 'vh.error.message';
        const storedMessage = new SessionStorage<ErrorMessage>(key);
        storedMessage.set(new ErrorMessage('disconnected', 'test message'));

        component.ngOnInit();
        expect(component.errorMessageTitle).toBe('disconnected');
        expect(component.errorMessageBody).toBe('test message');
        expect(component.connectionError).toBeTruthy();
    });
    it('should unsubscribe all subcriptions on destroy component', () => {
        component.ngOnDestroy();
        expect(component.subscription.closed).toBeTruthy();
    });
    it('should navigate to previous page on reconnect click and internet connection', () => {
        pageTrackerSpy.getPreviousUrl.calls.reset();
        spyOnProperty(window.navigator, 'onLine').and.returnValue(true);
        component.reconnect();
        expect(pageTrackerSpy.getPreviousUrl).toHaveBeenCalled();
    });

    it('should navigate to previous page on reconnect click and no internet connection', () => {
        component.returnTimeout = undefined;
        pageTrackerSpy.getPreviousUrl.calls.reset();
        spyOnProperty(window.navigator, 'onLine').and.returnValue(false);
        component.reconnect();
        expect(component.returnTimeout).toBeDefined();
        expect(pageTrackerSpy.getPreviousUrl).toHaveBeenCalledTimes(0);
    });

    it('should return true when browser has an internet connection', () => {
        spyOnProperty(window.navigator, 'onLine').and.returnValue(true);
        expect(component.hasInternetConnection).toBeTruthy();
    });

    it('should return false when browser does not have an internet connection', () => {
        spyOnProperty(window.navigator, 'onLine').and.returnValue(false);
        expect(component.hasInternetConnection).toBeFalsy();
    });

    it('should go back on timeout complete and no connection error', () => {
        spyOn(component, 'reconnect');
        component.connectionError = false;
        component.executeGoBackTimeout();
        expect(component.reconnect).toHaveBeenCalledTimes(1);
    });

    it('should not go back on timeout complete and has connection error', () => {
        spyOn(component, 'reconnect');
        component.connectionError = true;
        component.executeGoBackTimeout();
        expect(component.reconnect).toHaveBeenCalledTimes(0);
    });
});

describe('ErrorComponent Refresh', () => {
    let component: ErrorComponent;
    let fixture: ComponentFixture<ErrorComponent>;

    let router: Router;
    let pageTrackerSpy: jasmine.SpyObj<PageTrackerService>;

    beforeEach(() => {
        eventsService = eventsServiceSpy;
        pageTrackerSpy = jasmine.createSpyObj<PageTrackerService>(['trackPreviousPage', 'getPreviousUrl']);
        pageTrackerSpy.getPreviousUrl.and.returnValue('testUrl-test-error1');

        TestBed.configureTestingModule({
            declarations: [ErrorComponent, ContactUsFoldingComponent],
            imports: [RouterTestingModule],
            providers: [
                { provide: PageTrackerService, useValue: pageTrackerSpy },
                { provide: Router, useClass: MockRouter },
                { provide: EventsService, useValue: eventsService },
                { provide: Logger, useClass: MockLogger }
            ]
        }).compileComponents();
        router = TestBed.inject(Router);
        fixture = TestBed.createComponent(ErrorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should not navigate back on timer page refresh', fakeAsync(() => {
        spyOn(router, 'navigate');
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        component.connectionError = true;
        expect(router.navigate).toHaveBeenCalledTimes(0);
    }));
});
