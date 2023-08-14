import { fakeAsync, flush } from '@angular/core/testing';
import { LoggerService } from './logger.service';
import { LogAdapter } from './log-adapter';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { ActivatedRoute, ActivatedRouteSnapshot, convertToParamMap, Event, NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';

describe('LoggerService', () => {
    let logAdapter: jasmine.SpyObj<LogAdapter>;
    let service: LoggerService;
    let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
    let activatedRouteFirstChildSpy: jasmine.SpyObj<ActivatedRoute>;
    let routerSpy: jasmine.SpyObj<Router>;
    let eventsSubject: Subject<Event>;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate'], ['events']);
        eventsSubject = new Subject<Event>();
        getSpiedPropertyGetter(routerSpy, 'events').and.returnValue(eventsSubject.asObservable());

        activatedRouteSpy = jasmine.createSpyObj<ActivatedRoute>('ActivatedRoute', ['toString'], ['firstChild', 'snapshot', 'paramsMap']);
        activatedRouteFirstChildSpy = jasmine.createSpyObj<ActivatedRoute>('ActivatedRoute', ['toString'], ['paramMap']);

        getSpiedPropertyGetter(activatedRouteSpy, 'firstChild').and.returnValue(activatedRouteFirstChildSpy);

        logAdapter = jasmine.createSpyObj<LogAdapter>(['debug', 'trackException', 'trackEvent', 'info']);

        service = new LoggerService([logAdapter], routerSpy, activatedRouteSpy);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set the conference ID to what it is in the param map', fakeAsync(() => {
        // Arrange
        const conferenceId = 'conference-id';
        const routeSnapshot = new ActivatedRouteSnapshot();
        getSpiedPropertyGetter(activatedRouteSpy, 'snapshot').and.returnValue(routeSnapshot);
        spyOnProperty(routeSnapshot, 'paramMap', 'get').and.returnValue(
            convertToParamMap({
                conferenceId: conferenceId
            })
        );

        // Act
        eventsSubject.next(new NavigationEnd(null, null, null));
        flush();

        // Assert
        expect(service.currentConferenceId).toEqual(conferenceId);
    }));

    it('should update the conference ID to what it is in the param map when a second nav end happens', fakeAsync(() => {
        // Arrange
        const oldConferenceId = 'old-conference-id';
        const newConferenceId = 'conference-id';
        const routeSnapshot = new ActivatedRouteSnapshot();
        getSpiedPropertyGetter(activatedRouteSpy, 'snapshot').and.returnValue(routeSnapshot);
        const paramMapSpy = spyOnProperty(routeSnapshot, 'paramMap', 'get');
        paramMapSpy.and.returnValue(
            convertToParamMap({
                conferenceId: oldConferenceId
            })
        );

        eventsSubject.next(new NavigationEnd(null, null, null));
        flush();

        paramMapSpy.and.returnValue(
            convertToParamMap({
                conferenceId: newConferenceId
            })
        );

        // Act
        eventsSubject.next(new NavigationEnd(null, null, null));
        flush();

        // Assert
        expect(service.currentConferenceId).toEqual(newConferenceId);
    }));

    it('set conference id conference id to null if it is not in the param map', fakeAsync(() => {
        // Arrange
        const routeSnapshotSpy = jasmine.createSpyObj<ActivatedRouteSnapshot>(
            'ActivatedRouteSnapshot',
            ['toString'],
            ['firstChild', 'paramMap']
        );
        getSpiedPropertyGetter(activatedRouteSpy, 'snapshot').and.returnValue(routeSnapshotSpy);
        getSpiedPropertyGetter(routeSnapshotSpy, 'paramMap').and.returnValue(convertToParamMap({}));

        // Act
        eventsSubject.next(new NavigationEnd(null, null, null));
        flush();

        // Assert
        expect(service.currentConferenceId).toEqual(null);
    }));

    describe('logging methods', () => {
        const conferenceId = 'conference-id';
        beforeEach(fakeAsync(() => {
            const routeSnapshotSpy = jasmine.createSpyObj<ActivatedRouteSnapshot>(
                'ActivatedRouteSnapshot',
                ['toString'],
                ['firstChild', 'paramMap']
            );
            getSpiedPropertyGetter(activatedRouteSpy, 'snapshot').and.returnValue(routeSnapshotSpy);
            getSpiedPropertyGetter(routeSnapshotSpy, 'paramMap').and.returnValue(
                convertToParamMap({
                    conferenceId: conferenceId
                })
            );
            eventsSubject.next(new NavigationEnd(null, null, null));
            flush();
        }));

        it('should log events to all adapters', () => {
            // Arrange
            const message = 'msg';
            const properties = {
                message: message
            };

            const expectedProperties = {
                message: message
            };
            expectedProperties[LoggerService.currentConferenceIdPropertyKey] = conferenceId;

            // Act
            service.event(message, properties);

            // Assert
            expect(logAdapter.trackEvent).toHaveBeenCalledWith(message, expectedProperties);
        });

        it('should log errors to all adapters', () => {
            // Arrange
            const error = new Error();
            const message = 'msg';
            const properties = {
                message: message
            };

            const expectedProperties = {
                message: message
            };
            expectedProperties[LoggerService.currentConferenceIdPropertyKey] = conferenceId;

            // Act
            service.error(message, error, properties);

            // Assert
            expect(logAdapter.trackException).toHaveBeenCalledWith(message, error, expectedProperties);
        });

        it('should not log debug messages in production', () => {
            // Arrange
            logAdapter.debug.calls.reset();
            const message = 'msg';
            const properties = {
                message: message
            };
            service['higherLevelLogsOnly'] = true;

            // Act
            service.debug(message, properties);

            // Assert
            expect(logAdapter.debug).not.toHaveBeenCalled();
        });

        it('should add conference id to the properties', () => {
            // Arrange
            const message = 'msg';
            const properties = {
                message: message
            };

            const expectedProperties = {
                message: message
            };
            expectedProperties[LoggerService.currentConferenceIdPropertyKey] = conferenceId;

            // Act
            service.info(message, properties);

            // Assert
            expect(logAdapter.info).toHaveBeenCalledWith(message, expectedProperties);
        });

        it('should add conference id to the properties when no properties are provided', () => {
            // Arrange
            const message = 'msg';
            const properties = {
                message: message
            };

            const expectedProperties = {
                message: message
            };
            expectedProperties[LoggerService.currentConferenceIdPropertyKey] = conferenceId;

            // Act
            service.info(message, properties);

            // Assert
            expect(logAdapter.info).toHaveBeenCalledWith(message, expectedProperties);
        });
    });

    it('should log pexRtcInfo', () => {
        // Arrange
        const conferenceId = 'conference-id';
        const properties = {};

        service.currentConferenceId = conferenceId;

        const message = 'message';
        const expectedMessage = `[PexipApi] - Current Conference ID: ${conferenceId} - ${message}`;

        // Act
        service.pexRtcInfo(message);

        // Assert
        expect(logAdapter.info).toHaveBeenCalledWith(expectedMessage, undefined);
    });

    it('should log pexRtcInfo with properties', () => {
        // Arrange
        const conferenceId = 'conference-id';
        const properties = {
            hello: 'world'
        };

        service.currentConferenceId = conferenceId;

        const message = 'message';
        const expectedMessage = `[PexipApi] - Current Conference ID: ${conferenceId} - ${message}`;

        // Act
        service.pexRtcInfo(message, properties);

        // Assert
        expect(logAdapter.info).toHaveBeenCalledWith(expectedMessage, properties);
    });

    describe('addConferenceIdToProperties', () => {
        it('should add conference id to properties if they are an object', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const conferenceIdPropertyKey = 'conference-id';
            let properties = {};

            service.currentConferenceId = conferenceId;

            // Act
            properties = service.addConferenceIdToProperties(properties, conferenceIdPropertyKey);

            // Assert
            expect(properties[conferenceIdPropertyKey]).toEqual(conferenceId);
        });

        it('should NOT add conference id to properties if they are NOT an object', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const conferenceIdPropertyKey = 'conference-id';
            let properties = 'hello';

            service.currentConferenceId = conferenceId;

            // Act
            properties = service.addConferenceIdToProperties(properties, conferenceIdPropertyKey);

            // Assert
            expect(properties).toEqual(properties);
            expect(properties[conferenceIdPropertyKey]).toBeFalsy();
        });
    });
});
