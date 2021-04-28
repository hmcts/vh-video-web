import { Type } from '@angular/core';
import { Router, Event } from '@angular/router';
import { EventTypes, OidcClientNotification, PublicEventsService } from 'angular-auth-oidc-client';
import { of, Subject } from 'rxjs';
import { ProfileService } from '../services/api/profile.service';
import { Role, UserProfileResponse } from '../services/clients/api-client';
import { DeviceTypeService } from '../services/device-type.service';
import { ErrorService } from '../services/error.service';
import { pageUrls } from '../shared/page-url.constants';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
    let component: HomeComponent;
    let routerSpy: jasmine.SpyObj<Router>;
    let eventServiceSpy: jasmine.SpyObj<PublicEventsService>;
    let oidcClientNotificationSpy: jasmine.SpyObj<OidcClientNotification<any>>;


    beforeAll(() => {
        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
        eventServiceSpy = jasmine.createSpyObj('PublicEventsService', ['registerForEvents']);
    });

    beforeEach(() => {
        component = new HomeComponent(routerSpy, eventServiceSpy);
        routerSpy.navigate.and.callFake(() => Promise.resolve(true));
    });

    it('should go to navigator if user log in', async () => {
        debugger;
        oidcClientNotificationSpy = jasmine.createSpyObj('OidcClientNotification', {}, { type: EventTypes.UserDataChanged });
        eventServiceSpy.registerForEvents.and.returnValue(of(oidcClientNotificationSpy));
        component.ngOnInit();
        expect(routerSpy.navigate).toHaveBeenCalledWith([`/${pageUrls.Navigator}`]);
    });
});

/*
        subscribe(async (value: OidcClientNotification<AuthorizationResult>) => {
        eventService.registerForEvents.and.returnValue(of(oidcClientNotificationSpy));
        
        .subscribe(() => this.router.navigate([`/${pageUrls.Navigator}`]));
        eventService.registerForEvents(router)));
*/