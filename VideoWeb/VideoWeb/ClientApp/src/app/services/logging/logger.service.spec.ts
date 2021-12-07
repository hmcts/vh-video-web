import { TestBed, inject } from '@angular/core/testing';

import { LoggerService, LOG_ADAPTER } from './logger.service';
import { LogAdapter } from './log-adapter';
import { ConferenceService } from '../conference/conference.service';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { ActivatedRoute, ActivatedRouteSnapshot, convertToParamMap, Router } from '@angular/router';
import { ConferenceResponse } from '../clients/api-client';
import { Subject } from 'rxjs';

describe('LoggerService', () => {
    let logAdapter: jasmine.SpyObj<LogAdapter>;
    let conferenceServiceSpy: jasmine.SpyObj<ConferenceService>;
    let service: LoggerService;
    let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
    let activatedRouteFirstChildSpy: jasmine.SpyObj<ActivatedRoute>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate'], ['events']);

        activatedRouteSpy = jasmine.createSpyObj<ActivatedRoute>('ActivatedRoute', ['toString'], ['firstChild', 'snapshot', 'paramsMap']);
        activatedRouteFirstChildSpy = jasmine.createSpyObj<ActivatedRoute>('ActivatedRoute', ['toString'], ['paramMap']);

        getSpiedPropertyGetter(activatedRouteSpy, 'firstChild').and.returnValue(activatedRouteFirstChildSpy);

        logAdapter = jasmine.createSpyObj<LogAdapter>(['trackException', 'trackEvent', 'info']);
        conferenceServiceSpy = jasmine.createSpyObj<ConferenceService>('ConferenceService', ['getConferenceById'], ['currentConferenceId']);
        service = new LoggerService([logAdapter], routerSpy, activatedRouteSpy);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call set the conference ID to what it is in the param map', fakeAsync(() => {
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
        sut.initialiseConferenceFromActiveRoute();

        getConferenceSubject.next(expectedConferenceResult);
        flush();

        // Assert
        expect(apiClientSpy.getConferenceById).toHaveBeenCalledOnceWith(conferenceId);
        expect(getConference$.subscribe).toHaveBeenCalledTimes(1);
        expect(currentConferenceResult).toBeTruthy();
        expect(sut.currentConference).toEqual(expectedConferenceResult);
        expect(sut.currentConferenceId).toEqual(expectedConferenceResult.id);
        expect(currentConferenceResult).toEqual(expectedConferenceResult);
        expect(conferenceStatusResult).toEqual(expectedConferenceStatusResult);
    }));

    it('should log events to all adapters', () => {
        // Arrange
        const message = 'msg';
        const properties = {
            message: message
        };

        const conferenceId = 'conference-id';
        const expectedProperties = {
            message: message
        };
        expectedProperties[LoggerService.currentConferenceIdPropertyKey] = conferenceId;

        getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

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

        const conferenceId = 'conference-id';
        const expectedProperties = {
            message: message
        };
        expectedProperties[LoggerService.currentConferenceIdPropertyKey] = conferenceId;

        getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

        // Act
        service.error(message, error, properties);

        // Assert
        expect(logAdapter.trackException).toHaveBeenCalledWith(message, error, expectedProperties);
    });

    it('should add conference id to the properties', () => {
        // Arrange
        const message = 'msg';
        const properties = {
            message: message
        };

        const conferenceId = 'conference-id';
        const expectedProperties = {
            message: message
        };
        expectedProperties[LoggerService.currentConferenceIdPropertyKey] = conferenceId;

        getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

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

        const conferenceId = 'conference-id';
        const expectedProperties = {
            message: message
        };
        expectedProperties[LoggerService.currentConferenceIdPropertyKey] = conferenceId;

        getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

        // Act
        service.info(message, properties);

        // Assert
        expect(logAdapter.info).toHaveBeenCalledWith(message, expectedProperties);
    });

    describe('addConferenceIdToProperties', () => {
        it('should add conference id to properties if they are an object', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const conferenceIdPropertyKey = 'conference-id';
            let properties = {};
            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

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
            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            // Act
            properties = service.addConferenceIdToProperties(properties, conferenceIdPropertyKey);

            // Assert
            expect(properties).toEqual(properties);
            expect(properties[conferenceIdPropertyKey]).toBeFalsy();
        });
    });
});
