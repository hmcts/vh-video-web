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

describe('KinlyHeartbeatService', () => {
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
<<<<<<< HEAD
            // Act
            sut.initialiseHeartbeat(pexipApiMock);
            flush();

=======
            // Arrange
>>>>>>> origin
            currentConferenceSubject.next(undefined);
            loggedInParticipantSubject.next(participant);
            flush();

<<<<<<< HEAD
=======
            // Act
            sut.initialiseHeartbeat(pexipApiMock);
            flush();

>>>>>>> origin
            // Assert
            expect(sut.heartbeat).toBeFalsy();
            expect(apiClientSpy.getHeartbeatConfigForParticipant).not.toHaveBeenCalled();
        }));

        it('should do nothing if the current conference is null', fakeAsync(() => {
<<<<<<< HEAD
            // Act
            sut.initialiseHeartbeat(pexipApiMock);
            flush();

=======
            // Arrange
>>>>>>> origin
            currentConferenceSubject.next(null);
            loggedInParticipantSubject.next(participant);
            flush();

<<<<<<< HEAD
=======
            // Act
            sut.initialiseHeartbeat(pexipApiMock);
            flush();

>>>>>>> origin
            // Assert
            expect(sut.heartbeat).toBeFalsy();
            expect(apiClientSpy.getHeartbeatConfigForParticipant).not.toHaveBeenCalled();
        }));

        it('should do nothing if the current participant is undefined', fakeAsync(() => {
<<<<<<< HEAD
            // Act
            sut.initialiseHeartbeat(pexipApiMock);
            flush();

=======
            // Arrange
>>>>>>> origin
            currentConferenceSubject.next(conference);
            loggedInParticipantSubject.next(undefined);
            flush();

<<<<<<< HEAD
=======
            // Act
            sut.initialiseHeartbeat(pexipApiMock);
            flush();

>>>>>>> origin
            // Assert
            expect(sut.heartbeat).toBeFalsy();
            expect(apiClientSpy.getHeartbeatConfigForParticipant).not.toHaveBeenCalled();
        }));

        it('should do nothing if the current participant is null', fakeAsync(() => {
<<<<<<< HEAD
            // Act
            sut.initialiseHeartbeat(pexipApiMock);
            flush();

=======
            // Arrange
>>>>>>> origin
            currentConferenceSubject.next(conference);
            loggedInParticipantSubject.next(null);
            flush();

<<<<<<< HEAD
=======
            // Act
            sut.initialiseHeartbeat(pexipApiMock);
            flush();

>>>>>>> origin
            // Assert
            expect(sut.heartbeat).toBeFalsy();
            expect(apiClientSpy.getHeartbeatConfigForParticipant).not.toHaveBeenCalled();
        }));

        it('should get the heartbeat configuration for the participant and initialise the heartbeat', fakeAsync(() => {
<<<<<<< HEAD
            // Act
            sut.initialiseHeartbeat(pexipApiMock);
            flush();

=======
            // Arrange
>>>>>>> origin
            currentConferenceSubject.next(conference);
            loggedInParticipantSubject.next(participant);
            flush();

<<<<<<< HEAD
=======
            // Act
            sut.initialiseHeartbeat(pexipApiMock);
            flush();

>>>>>>> origin
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
<<<<<<< HEAD
            // Act & Assert
            expect(() => {
                sut.initialiseHeartbeat(pexipApiMock);

                currentConferenceSubject.next(conference);
                loggedInParticipantSubject.next(participant);
                flush();

=======
            // Arrange
            currentConferenceSubject.next(conference);
            loggedInParticipantSubject.next(participant);
            flush();

            // Act & Assert
            expect(() => {
                sut.initialiseHeartbeat(pexipApiMock);
>>>>>>> origin
                heartbeatConfigSubject.error(new Error());
                flush();
            }).not.toThrow();

            // Assert
            expect(sut.heartbeat).toBeFalsy();
            expect(apiClientSpy.getHeartbeatConfigForParticipant).toHaveBeenCalledOnceWith(participant.id);
        }));
    });

    describe('handleHeartbeat', () => {
<<<<<<< HEAD
        beforeEach(fakeAsync(() => {
            sut.initialiseHeartbeat(pexipApiMock);

            currentConferenceSubject.next(conference);
            loggedInParticipantSubject.next(participant);
            flush();
=======
        it('should stop the heartbeat if current conference is null', fakeAsync(() => {
            // Arrange
            const stopHeartbeatSpy = spyOn(sut, 'stopHeartbeat');

            currentConferenceSubject.next(null);
            loggedInParticipantSubject.next(participant);
            flush();

            // Act
            sut.handleHeartbeat(JSON.stringify({}));
            flush();

            // Assert
            expect(stopHeartbeatSpy).toHaveBeenCalledTimes(1);
            expect(heartbeatMapperSpy.map).not.toHaveBeenCalled();
            expect(eventServiceSpy.sendHeartbeat).not.toHaveBeenCalled();
        }));

        it('should stop the heartbeat if current conference is undefined', fakeAsync(() => {
            // Arrange
            const stopHeartbeatSpy = spyOn(sut, 'stopHeartbeat');

            currentConferenceSubject.next(undefined);
            loggedInParticipantSubject.next(participant);
            flush();

            // Act
            sut.handleHeartbeat(JSON.stringify({}));
            flush();

            // Assert
            expect(stopHeartbeatSpy).toHaveBeenCalledTimes(1);
            expect(heartbeatMapperSpy.map).not.toHaveBeenCalled();
            expect(eventServiceSpy.sendHeartbeat).not.toHaveBeenCalled();
        }));

        it('should stop the heartbeat if current participant is null', fakeAsync(() => {
            // Arrange
            const stopHeartbeatSpy = spyOn(sut, 'stopHeartbeat');

            currentConferenceSubject.next(conference);
            loggedInParticipantSubject.next(null);
            flush();

            // Act
            sut.handleHeartbeat(JSON.stringify({}));
            flush();

            // Assert
            expect(stopHeartbeatSpy).toHaveBeenCalledTimes(1);
            expect(heartbeatMapperSpy.map).not.toHaveBeenCalled();
            expect(eventServiceSpy.sendHeartbeat).not.toHaveBeenCalled();
        }));

        it('should stop the heartbeat if current participant is undefined', fakeAsync(() => {
            // Arrange
            const stopHeartbeatSpy = spyOn(sut, 'stopHeartbeat');

            currentConferenceSubject.next(conference);
            loggedInParticipantSubject.next(undefined);
            flush();

            // Act
            sut.handleHeartbeat(JSON.stringify({}));
            flush();

            // Assert
            expect(stopHeartbeatSpy).toHaveBeenCalledTimes(1);
            expect(heartbeatMapperSpy.map).not.toHaveBeenCalled();
            expect(eventServiceSpy.sendHeartbeat).not.toHaveBeenCalled();
>>>>>>> origin
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
