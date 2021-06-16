import { TestBed, inject } from '@angular/core/testing';

import { LoggerService, LOG_ADAPTER } from './logger.service';
import { LogAdapter } from './log-adapter';
import { ConferenceService } from '../conference/conference.service';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';

fdescribe('LoggerService', () => {
    const logAdapter = jasmine.createSpyObj<LogAdapter>(['trackException', 'trackEvent', 'info']);
    let conferenceServiceSpy: jasmine.SpyObj<ConferenceService>;

    beforeEach(() => {
        conferenceServiceSpy = jasmine.createSpyObj<ConferenceService>('ConferenceService', ['getConferenceById'], ['currentConferenceId']);

        TestBed.configureTestingModule({
            providers: [
                { provide: LOG_ADAPTER, useValue: logAdapter, multi: true },
                { provide: ConferenceService, useValue: conferenceServiceSpy }
            ]
        });
    });

    it('should be created', inject([LoggerService], (service: LoggerService) => {
        expect(service).toBeTruthy();
    }));

    it('should log events to all adapters', inject([LoggerService], (service: LoggerService) => {
        // Arrange
        const message = 'msg';
        const properties = {
            message: message
        };

        const conferenceId = 'conference-id';
        const expectedProperties = {
            message: message,
            conferenceId: conferenceId
        };

        getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

        // Act
        service.event(message, properties);

        // Assert
        expect(logAdapter.trackEvent).toHaveBeenCalledWith(message, expectedProperties);
    }));

    it('should log errors to all adapters', inject([LoggerService], (service: LoggerService) => {
        // Arrange
        const error = new Error();
        const message = 'msg';
        const properties = {
            message: message
        };

        const conferenceId = 'conference-id';
        const expectedProperties = {
            message: message,
            conferenceId: conferenceId
        };

        getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

        // Act
        service.error(message, error, properties);

        // Assert
        expect(logAdapter.trackException).toHaveBeenCalledWith(message, error, expectedProperties);
    }));

    it('should add conference id to the properties', inject([LoggerService], (service: LoggerService) => {
        // Arrange
        const message = 'msg';
        const properties = {
            message: message
        };

        const conferenceId = 'conference-id';
        const expectedProperties = {
            message: message,
            conferenceId: conferenceId
        };

        getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

        // Act
        service.info(message, properties);

        // Assert
        expect(logAdapter.info).toHaveBeenCalledWith(message, expectedProperties);
    }));

    it('should add conference id to the properties when no properties are provided', inject([LoggerService], (service: LoggerService) => {
        // Arrange
        const message = 'msg';
        const properties = {
            message: message
        };

        const conferenceId = 'conference-id';
        const expectedProperties = {
            message: message,
            conferenceId: conferenceId
        };

        getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

        // Act
        service.info(message, properties);

        // Assert
        expect(logAdapter.info).toHaveBeenCalledWith(message, expectedProperties);
    }));
});
