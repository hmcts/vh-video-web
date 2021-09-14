import { Event, Router } from '@angular/router';
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

describe('HomeComponent', () => {
    let component: HomeComponent;
    let routerSpy: jasmine.SpyObj<Router>;
    let eventServiceSpy: jasmine.SpyObj<PublicEventsService>;
    let oidcClientNotificationSpy: jasmine.SpyObj<OidcClientNotification<any>>;

    beforeAll(() => {
        eventServiceSpy = jasmine.createSpyObj('PublicEventsService', ['registerForEvents']);
        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl'], {
            events: new Subject<Event>()
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
});
