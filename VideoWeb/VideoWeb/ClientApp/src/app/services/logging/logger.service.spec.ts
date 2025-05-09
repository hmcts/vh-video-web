import { LoggerService } from './logger.service';
import { LogAdapter } from './log-adapter';
import { of } from 'rxjs';
import { FEATURE_FLAGS, LaunchDarklyService } from '../launch-darkly.service';
import { createMockStore, MockStore } from '@ngrx/store/testing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { mapConferenceToVHConference } from 'src/app/waiting-space/store/models/api-contract-to-state-model-mappers';
import { ConferenceState } from 'src/app/waiting-space/store/reducers/conference.reducer';
import * as ConferenceSelectors from '../../waiting-space/store/selectors/conference.selectors';

describe('LoggerService', () => {
    let logAdapter: jasmine.SpyObj<LogAdapter>;
    let service: LoggerService;
    let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;

    const conference = new ConferenceTestData().getConferenceDetailNow();
    let mockConferenceStore: MockStore<ConferenceState>;

    beforeEach(() => {
        let testConference = mapConferenceToVHConference(conference);
        mockConferenceStore = createMockStore({
            initialState: { currentConference: testConference, availableRooms: [] }
        });

        mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, testConference);

        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.enableDebugLogs, false).and.returnValue(of(false));

        logAdapter = jasmine.createSpyObj<LogAdapter>(['debug', 'trackException', 'trackEvent', 'info']);

        service = new LoggerService([logAdapter], mockConferenceStore, launchDarklyServiceSpy);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('no conference id', () => {
        it('should handle no conference in the store', () => {
            // Arrange
            mockConferenceStore.overrideSelector(ConferenceSelectors.getActiveConference, undefined);

            // Act
            mockConferenceStore.refreshState();

            // Assert
            expect(service.currentConferenceId).toBeNull();
        });
    });

    describe('logging methods', () => {
        const conferenceId = conference.id;

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

        it('should log debug messages in production when enable debug logs true', () => {
            // Arrange
            service.enableDebugLogs = true;
            logAdapter.debug.calls.reset();
            const message = 'msg';
            const properties = {
                message: message
            };
            service['higherLevelLogsOnly'] = false;

            // Act
            service.debug(message, properties);

            // Assert
            expect(logAdapter.debug).toHaveBeenCalled();
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
