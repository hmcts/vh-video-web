import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable } from 'rxjs';
import { PageTrackerService } from 'src/app/services/page-tracker.service';
import { SessionStorage } from 'src/app/services/session-storage';
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
}

@Component({ selector: 'app-mock-component', template: '' })
class Mock1Component {}

@Component({ selector: 'app-mock-component2', template: '' })
class Mock2Component {}

describe('ErrorComponent', () => {
    let component: ErrorComponent;
    let fixture: ComponentFixture<ErrorComponent>;

    let location: Location;
    let router: Router;
    let pageTrackerSpy: jasmine.SpyObj<PageTrackerService>;

    beforeEach(
        waitForAsync(() => {
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
                providers: [{ provide: PageTrackerService, useValue: pageTrackerSpy }]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        router = TestBed.inject(Router);
        location = TestBed.inject(Location);
        fixture = TestBed.createComponent(ErrorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
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
        pageTrackerSpy = jasmine.createSpyObj<PageTrackerService>(['trackPreviousPage', 'getPreviousUrl']);
        pageTrackerSpy.getPreviousUrl.and.returnValue('testUrl-test-error1');

        TestBed.configureTestingModule({
            declarations: [ErrorComponent, ContactUsFoldingComponent],
            imports: [RouterTestingModule],
            providers: [
                { provide: PageTrackerService, useValue: pageTrackerSpy },
                { provide: Router, useClass: MockRouter }
            ]
        }).compileComponents();
        router = TestBed.inject(Router);
        location = TestBed.inject(Location);
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
