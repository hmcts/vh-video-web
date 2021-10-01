import { discardPeriodicTasks, fakeAsync, flush } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { of, Subject } from 'rxjs';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { HeartbeatModelMapper } from 'src/app/shared/mappers/heartbeat-model-mapper';
import { Heartbeat } from 'src/app/shared/models/heartbeat';
import { ParticipantModel } from 'src/app/shared/models/participant';
import { pexipApiMock } from 'src/app/testing/mocks/mock-video-call.service';
import { ApiClient, ConferenceResponse, HeartbeatConfigurationResponse, ParticipantStatus, Role } from '../clients/api-client';
import { DeviceTypeService } from '../device-type.service';
import { EventsService } from '../events.service';
import { Logger } from '../logging/logger-base';
import { ConferenceService } from './conference.service';
import { KinlyHeartbeatService } from './kinly-heartbeat.service';
import { ParticipantService } from './participant.service';

fdescribe('KinlyHeartbeatService', () => {
    const participant = new ParticipantModel(
        Guid.create().toString(),
        null,
        null,
        null,
        null,
        Role.None,
        null,
        false,
        null,
        null,
        ParticipantStatus.None
    );
    const conference = new ConferenceResponse({ id: Guid.create().toString() });
    const heartbeatConfig = new HeartbeatConfigurationResponse({ heartbeat_url_base: 'url', heartbeat_jwt: 'jwt' });

    let sut: KinlyHeartbeatService;

    let apiClientSpy: jasmine.SpyObj<ApiClient>;
    let heartbeatConfigSubject: Subject<HeartbeatConfigurationResponse>;

    let participantServiceSpy: jasmine.SpyObj<ParticipantService>;
    let loggedInParticipantSubject: Subject<ParticipantModel>;

    let conferenceServiceSpy: jasmine.SpyObj<ConferenceService>;
    let currentConferenceSubject: Subject<ConferenceResponse>;

    let deviceTypeServiceSpy: jasmine.SpyObj<DeviceTypeService>;
    let heartbeatMapperSpy: jasmine.SpyObj<HeartbeatModelMapper>;
    let eventServiceSpy: jasmine.SpyObj<EventsService>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    beforeEach(() => {
        apiClientSpy = jasmine.createSpyObj<ApiClient>(['getHeartbeatConfigForParticipant'], []);
        heartbeatConfigSubject = new Subject<HeartbeatConfigurationResponse>();
        apiClientSpy.getHeartbeatConfigForParticipant.and.returnValue(heartbeatConfigSubject.asObservable());

        participantServiceSpy = jasmine.createSpyObj<ParticipantService>([], ['loggedInParticipant$']);
        loggedInParticipantSubject = new Subject<ParticipantModel>();
        getSpiedPropertyGetter(participantServiceSpy, 'loggedInParticipant$').and.returnValue(loggedInParticipantSubject.asObservable());

        conferenceServiceSpy = jasmine.createSpyObj<ConferenceService>([], ['currentConference$']);
        currentConferenceSubject = new Subject<ConferenceResponse>();
        getSpiedPropertyGetter(conferenceServiceSpy, 'currentConference$').and.returnValue(currentConferenceSubject.asObservable());

        deviceTypeServiceSpy = jasmine.createSpyObj<DeviceTypeService>(
            ['getBrowserName', 'getBrowserVersion', 'getOSName', 'getOSVersion'],
            []
        );
        heartbeatMapperSpy = jasmine.createSpyObj<HeartbeatModelMapper>(['map'], []);
        eventServiceSpy = jasmine.createSpyObj<EventsService>(['sendHeartbeat'], []);
        loggerSpy = jasmine.createSpyObj<Logger>(['debug', 'info', 'warn', 'error'], []);

        sut = new KinlyHeartbeatService(
            apiClientSpy,
            participantServiceSpy,
            conferenceServiceSpy,
            deviceTypeServiceSpy,
            heartbeatMapperSpy,
            eventServiceSpy,
            loggerSpy
        );
    });

    describe('initialiseHeartbeat', () => {
        it('should do nothing if the current conference is undefined', fakeAsync(() => {
            // Act
            sut.initialiseHeartbeat(pexipApiMock);
            flush();

            currentConferenceSubject.next(undefined);
            loggedInParticipantSubject.next(participant);
            flush();

            // Assert
            expect(sut.heartbeat).toBeFalsy();
            expect(apiClientSpy.getHeartbeatConfigForParticipant).not.toHaveBeenCalled();
        }));

        it('should do nothing if the current conference is null', fakeAsync(() => {
            // Act
            sut.initialiseHeartbeat(pexipApiMock);
            flush();

            currentConferenceSubject.next(null);
            loggedInParticipantSubject.next(participant);
            flush();

            // Assert
            expect(sut.heartbeat).toBeFalsy();
            expect(apiClientSpy.getHeartbeatConfigForParticipant).not.toHaveBeenCalled();
        }));

        it('should do nothing if the current participant is undefined', fakeAsync(() => {
            // Act
            sut.initialiseHeartbeat(pexipApiMock);
            flush();

            currentConferenceSubject.next(conference);
            loggedInParticipantSubject.next(undefined);
            flush();

            // Assert
            expect(sut.heartbeat).toBeFalsy();
            expect(apiClientSpy.getHeartbeatConfigForParticipant).not.toHaveBeenCalled();
        }));

        it('should do nothing if the current participant is null', fakeAsync(() => {
            // Act
            sut.initialiseHeartbeat(pexipApiMock);
            flush();

            currentConferenceSubject.next(conference);
            loggedInParticipantSubject.next(null);
            flush();

            // Assert
            expect(sut.heartbeat).toBeFalsy();
            expect(apiClientSpy.getHeartbeatConfigForParticipant).not.toHaveBeenCalled();
        }));

        it('should get the heartbeat configuration for the participant and initialise the heartbeat', fakeAsync(() => {
            // Act
            sut.initialiseHeartbeat(pexipApiMock);
            flush();

            currentConferenceSubject.next(conference);
            loggedInParticipantSubject.next(participant);
            flush();

            heartbeatConfigSubject.next(heartbeatConfig);
            flush();

            // Assert
            expect(sut.heartbeat).toBeTruthy();
            expect(apiClientSpy.getHeartbeatConfigForParticipant).toHaveBeenCalledOnceWith(participant.id);

            // Cleanup
            sut.heartbeat?.kill();
            sut.heartbeat = null;
            discardPeriodicTasks();
        }));

        it('should catch errors from getHeartbeatConfigForParticipant', fakeAsync(() => {
            // Act & Assert
            expect(() => {
                sut.initialiseHeartbeat(pexipApiMock);

                currentConferenceSubject.next(conference);
                loggedInParticipantSubject.next(participant);
                flush();

                heartbeatConfigSubject.error(new Error());
                flush();
            }).not.toThrow();

            // Assert
            expect(sut.heartbeat).toBeFalsy();
            expect(apiClientSpy.getHeartbeatConfigForParticipant).toHaveBeenCalledOnceWith(participant.id);
        }));
    });

    describe('handleHeartbeat', () => {
        beforeEach(fakeAsync(() => {
            sut.initialiseHeartbeat(pexipApiMock);

            currentConferenceSubject.next(conference);
            loggedInParticipantSubject.next(participant);
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

            currentConferenceSubject.next(conference);
            loggedInParticipantSubject.next(participant);
            flush();

            // Act
            sut.handleHeartbeat(JSON.stringify({}));
            flush();

            // Assert
            expect(stopHeartbeatSpy).not.toHaveBeenCalled();
            expect(heartbeatMapperSpy.map).toHaveBeenCalledOnceWith({}, browserName, browserVersion, osName, osVersion);
        }));

        it('should send the mapped heartbeat across the event bus', fakeAsync(() => {
            // Arrange
            const stopHeartbeatSpy = spyOn(sut, 'stopHeartbeat');

            const heartbeat = new Heartbeat();
            heartbeatMapperSpy.map.and.returnValue(heartbeat);

            currentConferenceSubject.next(conference);
            loggedInParticipantSubject.next(participant);
            flush();

            // Act
            sut.handleHeartbeat(JSON.stringify({}));
            flush();

            // Assert
            expect(stopHeartbeatSpy).not.toHaveBeenCalled();
            expect(eventServiceSpy.sendHeartbeat).toHaveBeenCalledOnceWith(conference.id, participant.id, heartbeat);
        }));
    });

    describe('stopHeartbeat', () => {
        it('should call kill and set the heartbeat to null', () => {
            // Arrange
            sut.heartbeat = {
                kill: () => {}
            };

            const killSpy = spyOn(sut.heartbeat, 'kill');

            // Act
            sut.stopHeartbeat();

            // Assert
            expect(killSpy).toHaveBeenCalledTimes(1);
            expect(sut.heartbeat).toBeFalsy();
        });
    });
});
