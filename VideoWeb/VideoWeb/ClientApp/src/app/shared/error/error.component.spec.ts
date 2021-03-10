import { Component, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync, getTestBed } from '@angular/core/testing';
import { NavigationEnd, NavigationExtras, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable, of } from 'rxjs';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { PageTrackerService } from 'src/app/services/page-tracker.service';
import { eventsServiceSpy, isConnectedSpy } from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { ContactUsFoldingComponent } from '../contact-us-folding/contact-us-folding.component';
import { ErrorMessage } from '../models/error-message';
import { ErrorComponent } from './error.component';
import { ErrorService } from 'src/app/services/error.service';
import { ConnectionStatusService } from 'src/app/services/connection-status.service';
import { connectionStatusServiceSpyFactory } from 'src/app/testing/mocks/mock-connection-status.service';
import { TranslateService } from '@ngx-translate/core';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation-service';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';

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
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    let connectionStatusServiceSpy: jasmine.SpyObj<ConnectionStatusService>;
    beforeEach(
        waitForAsync(() => {
            eventsService = eventsServiceSpy;
            pageTrackerSpy = jasmine.createSpyObj<PageTrackerService>(['trackPreviousPage', 'getPreviousUrl']);
            pageTrackerSpy.getPreviousUrl.and.returnValue('testUrl-test-error1');
            errorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', ['getErrorMessageFromStorage']);
            connectionStatusServiceSpy = connectionStatusServiceSpyFactory();

            TestBed.configureTestingModule({
                declarations: [ErrorComponent, ContactUsFoldingComponent, Mock1Component, Mock2Component, TranslatePipeMock],
                imports: [
                    RouterTestingModule.withRoutes([
                        { path: 'testUrl-test-error1', component: Mock1Component },
                        { path: 'testUrl-test-error2', component: Mock2Component }
                    ])
                ],
                providers: [
                    { provide: PageTrackerService, useValue: pageTrackerSpy },
                    { provide: EventsService, useValue: eventsService },
                    { provide: Logger, useClass: MockLogger },
                    { provide: ErrorService, useValue: errorServiceSpy },
                    { provide: ConnectionStatusService, useValue: connectionStatusServiceSpy },
                    { provide: TranslateService, useValue: translateServiceSpy }
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

    function spyPropertyGetter(spyObj: jasmine.SpyObj<any>, propName: string) {
        return Object.getOwnPropertyDescriptor(spyObj, propName).get as jasmine.Spy<jasmine.Func>;
    }

    it('should show default error message if session storage is empty', () => {
        errorServiceSpy.getErrorMessageFromStorage.and.returnValue(null);
        translateServiceSpy.instant.calls.reset();
        const text1 = 'error.default-body-message';
        component.ngOnInit();
        expect(component.errorMessageTitle).toBeUndefined();
        expect(component.errorMessageBody).toBe(text1);
        expect(component.connectionError).toBeFalsy();
        expect(component.isExtensionOrFirewallIssue).toBeFalsy();
    });

    it('should show default error message if internet connection is down', () => {
        spyPropertyGetter(connectionStatusServiceSpy, 'status').and.returnValue(false);
        translateServiceSpy.instant.calls.reset();
        const text1 = 'error.default-body-message';
        const text2 = `error.problem-with-connection`;

        component.ngOnInit();
        expect(component.errorMessageTitle).toBe(text2);
        expect(component.errorMessageBody).toBe(text1);
        expect(component.connectionError).toBeTruthy();
        expect(component.isExtensionOrFirewallIssue).toBeFalsy();
    });

    it('should show default error message if internet connection has been down in the past', () => {
        spyPropertyGetter(connectionStatusServiceSpy, 'status').and.returnValue(true);
        component.hasLostInternet = true;
        translateServiceSpy.instant.calls.reset();
        const text1 = 'error.default-body-message';
        const text2 = `error.problem-with-connection`;

        component.ngOnInit();
        expect(component.errorMessageTitle).toBe(text2);
        expect(component.errorMessageBody).toBe(text1);
        expect(component.connectionError).toBeTruthy();
        expect(component.isExtensionOrFirewallIssue).toBeFalsy();
    });

    it('should show error message if session storage returns a value', () => {
        errorServiceSpy.getErrorMessageFromStorage.and.returnValue(new ErrorMessage('disconnected', 'test message'));

        component.ngOnInit();
        expect(component.errorMessageTitle).toBe('disconnected');
        expect(component.errorMessageBody).toBe('test message');
        expect(component.connectionError).toBeTruthy();
        expect(component.isExtensionOrFirewallIssue).toBeFalsy();
    });

    it('should unsubscribe all subcriptions on destroy component', () => {
        component.ngOnDestroy();
        expect(component.subscription.closed).toBeTruthy();
    });

    it('should navigate to previous page on reconnect click and internet connection', () => {
        // ARRANGE
        pageTrackerSpy.getPreviousUrl.calls.reset();
        spyPropertyGetter(connectionStatusServiceSpy, 'status').and.returnValue(true);

        // ACT
        component.reconnect();

        // ASSERT
        expect(pageTrackerSpy.getPreviousUrl).toHaveBeenCalled();
    });

    it('should navigate to previous page on reconnect click and internet connection but has been down', () => {
        // ARRANGE
        component.hasLostInternet = true;
        pageTrackerSpy.getPreviousUrl.calls.reset();
        spyPropertyGetter(connectionStatusServiceSpy, 'status').and.returnValue(true);

        // ACT
        component.reconnect();

        // ASSERT
        expect(pageTrackerSpy.getPreviousUrl).toHaveBeenCalled();
    });

    it('should not navigate to previous page on reconnect click and no internet connection', () => {
        // ARRANGE
        pageTrackerSpy.getPreviousUrl.calls.reset();
        spyPropertyGetter(connectionStatusServiceSpy, 'status').and.returnValue(false);

        // ACT
        component.reconnect();

        // ASSERT
        expect(pageTrackerSpy.getPreviousUrl).toHaveBeenCalledTimes(0);
    });

    it('should return true when browser has an internet connection', () => {
        // ARRANGE
        spyPropertyGetter(connectionStatusServiceSpy, 'status').and.returnValue(true);

        // ASSERT
        expect(component.hasInternetConnection).toBeTruthy();
    });

    it('should return false when browser does not have an internet connection', () => {
        // ARRANGE
        spyPropertyGetter(connectionStatusServiceSpy, 'status').and.returnValue(false);

        // ASSERT
        expect(component.hasInternetConnection).toBeFalsy();
    });

    it('should not go back if already reconnecting in progress', () => {
        // ARRANGE
        component.attemptingReconnect = true;
        pageTrackerSpy.getPreviousUrl.calls.reset();
        component.reconnect();

        // ASSERT
        expect(pageTrackerSpy.getPreviousUrl).toHaveBeenCalledTimes(0);
    });

    it('should show error message for firewall issue if session storage returns a value', () => {
        // ARRANGE
        errorServiceSpy.getErrorMessageFromStorage.and.returnValue(new ErrorMessage('FirewallProblem', null, true));

        // ACT
        component.ngOnInit();

        // ASSERT
        expect(component.errorMessageTitle).toBe('FirewallProblem');
        expect(component.connectionError).toBeTruthy();
        expect(component.isExtensionOrFirewallIssue).toBeTruthy();
    });
});

describe('ErrorComponent Refresh', () => {
    let component: ErrorComponent;
    let fixture: ComponentFixture<ErrorComponent>;

    let router: Router;
    let pageTrackerSpy: jasmine.SpyObj<PageTrackerService>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    let connectionStatusServiceSpy: jasmine.SpyObj<ConnectionStatusService>;

    beforeEach(() => {
        eventsService = eventsServiceSpy;
        pageTrackerSpy = jasmine.createSpyObj<PageTrackerService>(['trackPreviousPage', 'getPreviousUrl']);
        pageTrackerSpy.getPreviousUrl.and.returnValue('testUrl-test-error1');
        errorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', ['getErrorMessageFromStorage']);
        connectionStatusServiceSpy = jasmine.createSpyObj<ConnectionStatusService>('ConnectionStatusService', ['status']);

        TestBed.configureTestingModule({
            declarations: [ErrorComponent, ContactUsFoldingComponent, TranslatePipeMock],
            imports: [RouterTestingModule],
            providers: [
                { provide: PageTrackerService, useValue: pageTrackerSpy },
                { provide: Router, useClass: MockRouter },
                { provide: EventsService, useValue: eventsService },
                { provide: Logger, useClass: MockLogger },
                { provide: ErrorService, useValue: errorServiceSpy },
                { provide: ConnectionStatusService, useValue: connectionStatusServiceSpy },
                { provide: TranslateService, useValue: translateServiceSpy }
            ]
        }).compileComponents();
        router = TestBed.inject(Router);
        fixture = TestBed.createComponent(ErrorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should not navigate back on timer page refresh', fakeAsync(() => {
        // ARRANGE
        spyOn(router, 'navigate');
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        component.connectionError = true;

        // ASSERT
        expect(router.navigate).toHaveBeenCalledTimes(0);
    }));
});
