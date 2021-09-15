import { Event, NavigationEnd, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import {
    PublicEventsService,
    OidcClientNotification,
    EventTypes,
    AuthorizationResult,
    AuthorizedState,
    ValidationResult
} from 'angular-auth-oidc-client';
import { pageUrls } from '../shared/page-url.constants';
import { MockLogger } from '../testing/mocks/mock-logger';
import { HomeComponent } from './home.component';
import { fakeAsync, flush } from '@angular/core/testing';

describe('HomeComponent', () => {
    let component: HomeComponent;
    let routerSpy: jasmine.SpyObj<Router>;
    let eventServiceSpy: jasmine.SpyObj<PublicEventsService>;
    let oidcClientNotificationSpy: jasmine.SpyObj<OidcClientNotification<any>>;
    const eventsSubjects = new Subject<Event>();

    beforeAll(() => {
        eventServiceSpy = jasmine.createSpyObj('PublicEventsService', ['registerForEvents']);
        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl'], {
            events: eventsSubjects.asObservable()
        });
    });

    beforeEach(() => {
        component = new HomeComponent(routerSpy, eventServiceSpy, new MockLogger());
        routerSpy.navigate.and.callFake(() => Promise.resolve(true));
    });

    it('should go to navigator if user log in', async () => {
        const eventValue: OidcClientNotification<AuthorizationResult> = {
            type: EventTypes.NewAuthorizationResult,
            value: { isRenewProcess: false, authorizationState: AuthorizedState.Authorized, validationResult: ValidationResult.Ok }
        };
        oidcClientNotificationSpy = jasmine.createSpyObj('OidcClientNotification', {}, eventValue);
        eventServiceSpy.registerForEvents.and.returnValue(of(oidcClientNotificationSpy));
        component.ngOnInit();
        expect(routerSpy.navigate).toHaveBeenCalledWith([`/${pageUrls.Navigator}`]);
    });

    it('should unsubsribe destroyedSubject', async () => {
        const subjectSpy = jasmine.createSpyObj<Subject<any>>('Subject', ['next', 'complete']);
        component['destroyedSubject$'] = subjectSpy;
        component.ngOnDestroy();
        expect(subjectSpy.next).toHaveBeenCalled();
        expect(subjectSpy.complete).toHaveBeenCalled();
    });

    it('should return ', fakeAsync(() => {
        const navEvent = new NavigationEnd(1, 'url', 'urlAfterRedirects');
        eventsSubjects.next(navEvent);
        flush();
        expect(component.previousPageUrl).toEqual('urlAfterRedirects');
    }));

    it('should navigate IdpSelection page when input home page url manually', async () => {
        component.previousPageUrl = `/${pageUrls.Home}`;
        const eventValue: OidcClientNotification<AuthorizationResult> = {
            type: EventTypes.ConfigLoaded
        };
        oidcClientNotificationSpy = jasmine.createSpyObj('OidcClientNotification', {}, eventValue);
        eventServiceSpy.registerForEvents.and.returnValue(of(oidcClientNotificationSpy));
        component.ngOnInit();
        expect(routerSpy.navigate).toHaveBeenCalledWith([`/${pageUrls.Login}`]);
    });
});
