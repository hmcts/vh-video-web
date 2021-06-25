import { fakeAsync, flush } from '@angular/core/testing';
import { ActivatedRoute, ActivatedRouteSnapshot, convertToParamMap, Event, NavigationEnd, ParamMap, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { ApiClient, ConferenceResponse } from '../clients/api-client';
import { EventsService } from '../events.service';
import { Logger } from '../logging/logger-base';

import { ConferenceService } from './conference.service';

fdescribe('ConferenceService', () => {
    let sut: ConferenceService;

    let routerSpy: jasmine.SpyObj<Router>;
    let eventsSubject: Subject<Event>;
    let eventsServiceSpy: jasmine.SpyObj<EventsService>;
    let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
    let activatedRouteFirstChildSpy: jasmine.SpyObj<ActivatedRoute>;
    let apiClientSpy: jasmine.SpyObj<ApiClient>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate'], ['events']);

        eventsSubject = new Subject<Event>();
        getSpiedPropertyGetter(routerSpy, 'events').and.returnValue(eventsSubject.asObservable());

        eventsServiceSpy = jasmine.createSpyObj<EventsService>('EventsService', ['getServiceReconnected']);

        activatedRouteSpy = jasmine.createSpyObj<ActivatedRoute>('ActivatedRoute', ['toString'], ['firstChild', 'snapshot', 'paramsMap']);
        activatedRouteFirstChildSpy = jasmine.createSpyObj<ActivatedRoute>('ActivatedRoute', ['toString'], ['paramMap']);

        getSpiedPropertyGetter(activatedRouteSpy, 'firstChild').and.returnValue(activatedRouteFirstChildSpy);

        apiClientSpy = jasmine.createSpyObj<ApiClient>('ApiClient', ['getConferenceById']);

        loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['warn', 'info']);

        sut = new ConferenceService(routerSpy, activatedRouteSpy, eventsServiceSpy, apiClientSpy);
    });

    describe('construction', () => {
        it('should be created', () => {
            expect(sut).toBeTruthy();
        });

        it('should subscribe to the first child param map on construction', () => {
            // Arrange
            const events$ = new Observable<Event>();
            spyOn(events$, 'pipe').and.returnValue(events$);
            spyOn(events$, 'subscribe').and.callThrough();

            getSpiedPropertyGetter(routerSpy, 'events').and.returnValue(events$);

            // Act
            new ConferenceService(routerSpy, activatedRouteSpy, eventsServiceSpy, apiClientSpy);

            // Assert
            expect(events$.subscribe).toHaveBeenCalledTimes(1);
        });
    });

    describe('handle navigation end', () => {
        it('should call getConferenceId when the router navigation ends and conference id is in the param map', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            const routeSnapshot = new ActivatedRouteSnapshot();
            getSpiedPropertyGetter(activatedRouteSpy, 'snapshot').and.returnValue(routeSnapshot);
            spyOnProperty(routeSnapshot, 'paramMap', 'get').and.returnValue(
                convertToParamMap({
                    conferenceId: conferenceId
                })
            );

            const getConferenceSubject = new Subject<ConferenceResponse>();
            const getConference$ = getConferenceSubject.asObservable();

            spyOn(getConference$, 'subscribe').and.callThrough();
            apiClientSpy.getConferenceById.and.returnValue(getConference$);

            const expectedConference = new ConferenceResponse({
                id: conferenceId
            });

            let result = null;
            sut.currentConference$.subscribe(conference => (result = conference));

            // Act
            eventsSubject.next(new NavigationEnd(0, 'url', 'url-redirects'));
            flush();

            getConferenceSubject.next(expectedConference);
            flush();

            // Assert
            expect(apiClientSpy.getConferenceById).toHaveBeenCalledOnceWith(conferenceId);
            expect(getConference$.subscribe).toHaveBeenCalledTimes(1);
            expect(result).toBeTruthy();
            expect(result).toBe(expectedConference);
        }));

        it('should NOT call getConferenceId when the router navigation ends and conference id is NOT in the param map', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            const routeSnapshotSpy = jasmine.createSpyObj<ActivatedRouteSnapshot>(
                'ActivatedRouteSnapshot',
                ['toString'],
                ['firstChild', 'paramMap']
            );
            getSpiedPropertyGetter(activatedRouteSpy, 'snapshot').and.returnValue(routeSnapshotSpy);
            getSpiedPropertyGetter(routeSnapshotSpy, 'paramMap').and.returnValue(
                convertToParamMap({
                    notConferenceId: conferenceId
                })
            );

            const getConferenceSubject = new Subject<ConferenceResponse>();
            const getConference$ = getConferenceSubject.asObservable();

            spyOn(getConference$, 'subscribe').and.callThrough();
            apiClientSpy.getConferenceById.and.returnValue(getConference$);

            const expectedConference = new ConferenceResponse({
                id: conferenceId
            });

            let result = null;
            sut.currentConference$.subscribe(conference => (result = conference));

            // Act
            eventsSubject.next(new NavigationEnd(0, 'url', 'url-redirects'));
            flush();

            getConferenceSubject.next(expectedConference);
            flush();

            // Assert
            expect(apiClientSpy.getConferenceById).not.toHaveBeenCalled();
            expect(getConference$.subscribe).not.toHaveBeenCalled();
            expect(result).toBeFalsy();
        }));
    });

    describe('getConferenceById', () => {
        it('should return the observable returned by apiClient.getConferenceById', () => {
            // Arrange
            const conferenceId = 'conference-id';

            const expectedResult = new Observable<ConferenceResponse>();
            apiClientSpy.getConferenceById.and.returnValue(expectedResult);

            // Act
            const result = sut.getConferenceById(conferenceId);

            // Assert
            expect(result).toEqual(expectedResult);
            expect(apiClientSpy.getConferenceById).toHaveBeenCalledOnceWith(conferenceId);
        });
    });
});
