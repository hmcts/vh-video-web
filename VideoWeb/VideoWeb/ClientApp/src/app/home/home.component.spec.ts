import { ActivatedRoute, Router } from '@angular/router';
import {
    AuthorizationResult,
    AuthorizedState,
    EventTypes,
    OidcClientNotification,
    PublicEventsService,
    ValidationResult
} from 'angular-auth-oidc-client';
import { of } from 'rxjs';
import { pageUrls } from '../shared/page-url.constants';
import { ActivatedRouteSnapshotMock } from '../testing/mocks/mock-activated-route-snapshot';
import { MockLogger } from '../testing/mocks/mock-logger';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
    let component: HomeComponent;
    let routerSpy: jasmine.SpyObj<Router>;
    let eventServiceSpy: jasmine.SpyObj<PublicEventsService>;
    let oidcClientNotificationSpy: jasmine.SpyObj<OidcClientNotification<any>>;
    let routeSpy: jasmine.SpyObj<ActivatedRoute>;

    beforeAll(() => {
        const snapshotMock = new ActivatedRouteSnapshotMock();
        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
        eventServiceSpy = jasmine.createSpyObj('PublicEventsService', ['registerForEvents']);
        routeSpy = jasmine.createSpyObj('ActivatedRoute', [], {
            snapshot: snapshotMock
        });
    });

    beforeEach(() => {
        component = new HomeComponent(routerSpy, eventServiceSpy, new MockLogger(), routeSpy);
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

    it('should navigate IdpSelection page when input home page url manually', async () => {
        const eventValue: OidcClientNotification<AuthorizationResult> = {
            type: EventTypes.ConfigLoaded
        };
        oidcClientNotificationSpy = jasmine.createSpyObj('OidcClientNotification', {}, eventValue);
        eventServiceSpy.registerForEvents.and.returnValue(of(oidcClientNotificationSpy));
        component.ngOnInit();
        expect(routerSpy.navigate).toHaveBeenCalledWith([`/${pageUrls.Login}`]);
    });
});
