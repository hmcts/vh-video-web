import { discardPeriodicTasks, fakeAsync, flush } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { HeartbeatModelMapper } from 'src/app/shared/mappers/heartbeat-model-mapper';
import { Heartbeat } from 'src/app/shared/models/heartbeat';
import { pexipApiMock } from 'src/app/testing/mocks/mock-video-call.service';
import { ApiClient, HeartbeatConfigurationResponse } from '../clients/api-client';
import { DeviceTypeService } from '../device-type.service';
import { EventsService } from '../events.service';
import { Logger } from '../logging/logger-base';
import { HeartbeatService } from './heartbeat.service';
import { initialState as initialConferenceState, ConferenceState } from 'src/app/waiting-space/store/reducers/conference.reducer';
import * as ConferenceSelectors from 'src/app/waiting-space/store/selectors/conference.selectors';
import { createMockStore, MockStore } from '@ngrx/store/testing';
import { VHConference, VHParticipant } from 'src/app/waiting-space/store/models/vh-conference';

describe('HeartbeatService', () => {
    const heartbeatConfig = new HeartbeatConfigurationResponse({ heartbeat_url_base: 'url', heartbeat_jwt: 'jwt' });

    let sut: HeartbeatService;

    let apiClientSpy: jasmine.SpyObj<ApiClient>;
    let heartbeatConfigSubject: Subject<HeartbeatConfigurationResponse>;

    let mockStore: MockStore<ConferenceState>;

    let deviceTypeServiceSpy: jasmine.SpyObj<DeviceTypeService>;
    let heartbeatMapperSpy: jasmine.SpyObj<HeartbeatModelMapper>;
    let eventServiceSpy: jasmine.SpyObj<EventsService>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    beforeEach(() => {
        const initialState = initialConferenceState;
        mockStore = createMockStore({ initialState });
        apiClientSpy = jasmine.createSpyObj<ApiClient>(['getHeartbeatConfigForParticipant'], []);
        heartbeatConfigSubject = new Subject<HeartbeatConfigurationResponse>();
        apiClientSpy.getHeartbeatConfigForParticipant.and.returnValue(heartbeatConfigSubject.asObservable());

        deviceTypeServiceSpy = jasmine.createSpyObj<DeviceTypeService>(
            ['getBrowserName', 'getBrowserVersion', 'getOSName', 'getOSVersion', 'getDevice'],
            []
        );
        heartbeatMapperSpy = jasmine.createSpyObj<HeartbeatModelMapper>(['map'], []);
        eventServiceSpy = jasmine.createSpyObj<EventsService>(['sendHeartbeat'], []);
        loggerSpy = jasmine.createSpyObj<Logger>(['debug', 'info', 'warn', 'error'], []);

        sut = new HeartbeatService(apiClientSpy, mockStore, deviceTypeServiceSpy, heartbeatMapperSpy, eventServiceSpy, loggerSpy);
    });

    afterEach(() => {
        mockStore.resetSelectors();
    });

    describe('initialiseHeartbeat', () => {
        it('should do nothing if the current conference is undefined', fakeAsync(() => {
            // arrange
            const loggedInParticipant = { id: '456' } as VHParticipant;
            mockStore.overrideSelector(ConferenceSelectors.getActiveConference, undefined);
            mockStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            // act
            sut.initialiseHeartbeat(pexipApiMock);
            flush();

            // Assert
            expect(sut.heartbeat).toBeFalsy();
            expect(apiClientSpy.getHeartbeatConfigForParticipant).not.toHaveBeenCalled();
        }));

        it('should do nothing if heartbeat is already initialised', fakeAsync(() => {
            // arrange
            const heartbeatSpy = jasmine.createSpyObj<HeartbeatClient>(['kill'], []);
            sut.heartbeat = heartbeatSpy;

            // Act
            sut.initialiseHeartbeat(pexipApiMock);
            flush();

            expect(apiClientSpy.getHeartbeatConfigForParticipant).not.toHaveBeenCalled();
        }));

        it('should do nothing if the heartbeat is initialising', fakeAsync(() => {
            // arrange
            sut.initialising = true;

            // Act
            sut.initialiseHeartbeat(pexipApiMock);
            flush();

            expect(apiClientSpy.getHeartbeatConfigForParticipant).not.toHaveBeenCalled();
        }));

        it('should do nothing if the current participant is undefined', fakeAsync(() => {
            // Act
            sut.initialiseHeartbeat(pexipApiMock);
            flush();

            const activeConference = { id: '123' } as VHConference;
            mockStore.overrideSelector(ConferenceSelectors.getActiveConference, activeConference);
            mockStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, undefined);
            flush();

            // Assert
            expect(sut.heartbeat).toBeFalsy();
            expect(apiClientSpy.getHeartbeatConfigForParticipant).not.toHaveBeenCalled();
        }));

        it('should get the heartbeat configuration for the participant and initialise the heartbeat', fakeAsync(() => {
            // Arrange
            const activeConference = { id: '123' } as VHConference;
            const loggedInParticipant = { id: '456' } as VHParticipant;
            mockStore.overrideSelector(ConferenceSelectors.getActiveConference, activeConference);
            mockStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);

            // Act
            sut.initialiseHeartbeat(pexipApiMock);
            flush();

            heartbeatConfigSubject.next(heartbeatConfig);
            flush();

            // Assert
            expect(sut.heartbeat).toBeTruthy();
            expect(apiClientSpy.getHeartbeatConfigForParticipant).toHaveBeenCalledOnceWith(activeConference.id, loggedInParticipant.id);

            // Cleanup
            sut.heartbeat?.kill();
            sut.heartbeat = null;
            discardPeriodicTasks();
        }));

        it('should catch errors from getHeartbeatConfigForParticipant', fakeAsync(() => {
            // Act & Assert
            const activeConference = { id: '123' } as VHConference;
            const loggedInParticipant = { id: '456' } as VHParticipant;
            mockStore.overrideSelector(ConferenceSelectors.getActiveConference, activeConference);
            mockStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);
            expect(() => {
                sut.initialiseHeartbeat(pexipApiMock);

                flush();

                heartbeatConfigSubject.error(new Error());
                flush();
            }).not.toThrow();

            // Assert
            expect(sut.heartbeat).toBeFalsy();
            expect(apiClientSpy.getHeartbeatConfigForParticipant).toHaveBeenCalledOnceWith(activeConference.id, loggedInParticipant.id);
        }));
    });

    describe('handleHeartbeat', () => {
        let activeConference: VHConference;
        let loggedInParticipant: VHParticipant;

        beforeEach(fakeAsync(() => {
            activeConference = { id: '123' } as VHConference;
            loggedInParticipant = { id: '456' } as VHParticipant;
            mockStore.overrideSelector(ConferenceSelectors.getActiveConference, activeConference);
            mockStore.overrideSelector(ConferenceSelectors.getLoggedInParticipant, loggedInParticipant);
            sut.initialiseHeartbeat(pexipApiMock);

            flush();
        }));

        it('should should map the heartbeat', fakeAsync(() => {
            // Arrange
            const stopHeartbeatSpy = spyOn(sut, 'stopHeartbeat');

            const browserName = 'browser-name';
            deviceTypeServiceSpy.getBrowserName.and.returnValue(browserName);

            const browserVersion = 'browser-version';
            deviceTypeServiceSpy.getBrowserVersion.and.returnValue(browserVersion);

            const osName = 'os-name';
            deviceTypeServiceSpy.getOSName.and.returnValue(osName);

            const osVersion = 'os-version';
            deviceTypeServiceSpy.getOSVersion.and.returnValue(osVersion);

            const device = 'device-type';
            deviceTypeServiceSpy.getDevice.and.returnValue(device);

            flush();

            // Act
            sut.handleHeartbeat(JSON.stringify({}));
            flush();

            // Assert
            expect(stopHeartbeatSpy).not.toHaveBeenCalled();
            expect(heartbeatMapperSpy.map).toHaveBeenCalledOnceWith({}, browserName, browserVersion, osName, osVersion, device);
        }));

        it('should send the mapped heartbeat across the event bus', fakeAsync(() => {
            // Arrange
            const stopHeartbeatSpy = spyOn(sut, 'stopHeartbeat');

            const heartbeat = new Heartbeat();
            heartbeatMapperSpy.map.and.returnValue(heartbeat);
            flush();

            // Act
            sut.handleHeartbeat(JSON.stringify({}));
            flush();

            // Assert
            expect(stopHeartbeatSpy).not.toHaveBeenCalled();
            expect(eventServiceSpy.sendHeartbeat).toHaveBeenCalledOnceWith(activeConference.id, loggedInParticipant.id, heartbeat);
        }));
    });

    describe('stopHeartbeat', () => {
        it('should call kill and set the heartbeat to null', () => {
            // Arrange
            const heartbeatSpy = jasmine.createSpyObj<HeartbeatClient>(['kill'], []);
            sut.heartbeat = heartbeatSpy;

            // Act
            sut.stopHeartbeat();

            // Assert
            expect(heartbeatSpy.kill).toHaveBeenCalledTimes(1);
            expect(sut.heartbeat).toBeFalsy();
        });

        it('should do nothing if the heartbeat is null', () => {
            // Arrange
            sut.heartbeat = null;

            // Act
            sut.stopHeartbeat();

            // Assert
            expect(loggerSpy.debug).toHaveBeenCalledWith(jasmine.stringMatching(/Couldn't stop the heartbeat as it didn't exist/));
        });
    });
});
