import * as signalR from '@microsoft/signalr';
import { Guid } from 'guid-typescript';
import { Observable, Subscription } from 'rxjs';
import { MockLogger } from '../testing/mocks/mock-logger';
import { EventsService } from './events.service';
import { Logger } from './logging/logger-base';
import { InstantMessage } from './models/instant-message';
import { fakeAsync, tick } from '@angular/core/testing';
import { EventsHubService } from './events-hub.service';
import { Heartbeat } from '../shared/models/heartbeat';
import { TransferDirection } from './models/hearing-transfer';
import { ParticipantMediaStatus } from '../shared/models/participant-media-status';
import { ConferenceResponse, ParticipantResponse, VideoEndpointResponse } from './clients/api-client';
import { UpdateEndpointsDto } from '../shared/models/update-endpoints-dto';
import { createMockStore, MockStore } from '@ngrx/store/testing';
import { ConferenceState, initialState as initialConferenceState } from '../waiting-space/store/reducers/conference.reducer';

describe('EventsService', () => {
    function spyPropertyGetter<T, K extends keyof T>(spyObj: jasmine.SpyObj<T>, propName: K): jasmine.Spy<() => T[K]> {
        return Object.getOwnPropertyDescriptor(spyObj, propName)?.get as jasmine.Spy<() => T[K]>;
    }

    let serviceUnderTest: EventsService;
    let loggerMock: Logger;
    let eventsHubServiceSpy: jasmine.SpyObj<EventsHubService>;
    let subscription$: Subscription;
    let mockStore: MockStore<ConferenceState>;

    beforeEach(() => {
        const initialState = initialConferenceState;
        mockStore = createMockStore({ initialState });

        loggerMock = new MockLogger();
        eventsHubServiceSpy = jasmine.createSpyObj<EventsHubService>(
            'EventsHubService',
            ['start', 'stop', 'getServiceConnected', 'getServiceDisconnected'],
            ['connection', 'onEventsHubReady']
        );
        eventsHubServiceSpy.getServiceConnected.and.returnValue(new Observable<any>());
        eventsHubServiceSpy.getServiceDisconnected.and.returnValue(new Observable<number>());
        spyPropertyGetter(eventsHubServiceSpy, 'onEventsHubReady').and.returnValue(new Observable());
        serviceUnderTest = new EventsService(loggerMock, eventsHubServiceSpy, mockStore);
        subscription$ = new Subscription();
    });

    afterEach(() => {
        subscription$.unsubscribe();
    });

    it('should init observables', () => {
        // Arrange

        // Act
        subscription$.add(serviceUnderTest.getServiceConnected().subscribe());
        subscription$.add(serviceUnderTest.getServiceDisconnected().subscribe());
        subscription$.add(serviceUnderTest.getParticipantStatusMessage().subscribe());
        subscription$.add(serviceUnderTest.getHearingStatusMessage().subscribe());
        subscription$.add(serviceUnderTest.getConsultationRequestResponseMessage().subscribe());
        subscription$.add(serviceUnderTest.getChatMessage().subscribe());
        subscription$.add(serviceUnderTest.getAdminAnsweredChat().subscribe());
        subscription$.add(serviceUnderTest.getEndpointStatusMessage().subscribe());
        subscription$.add(serviceUnderTest.getHearingCountdownCompleteMessage().subscribe());
        subscription$.add(serviceUnderTest.getRequestedConsultationMessage().subscribe());
        subscription$.add(serviceUnderTest.getHearingTransfer().subscribe());
        subscription$.add(serviceUnderTest.getParticipantMediaStatusMessage().subscribe());
        subscription$.add(serviceUnderTest.getParticipantRemoteMuteStatusMessage().subscribe());
        subscription$.add(serviceUnderTest.getParticipantHandRaisedMessage().subscribe());
        subscription$.add(serviceUnderTest.getRoomUpdate().subscribe());
        subscription$.add(serviceUnderTest.getRoomTransfer().subscribe());
        subscription$.add(serviceUnderTest.getHeartbeat().subscribe());
        subscription$.add(serviceUnderTest.getServiceConnected().subscribe());
        subscription$.add(serviceUnderTest.getServiceDisconnected().subscribe());
        subscription$.add(serviceUnderTest.getParticipantsUpdated().subscribe());
        subscription$.add(serviceUnderTest.getEndpointsUpdated().subscribe());
        subscription$.add(serviceUnderTest.getHearingLayoutChanged().subscribe());
        subscription$.add(serviceUnderTest.getNewConferenceAdded().subscribe());
        subscription$.add(serviceUnderTest.getHearingCancelled().subscribe());
        subscription$.add(serviceUnderTest.getHearingDetailsUpdated().subscribe());

        // Assert
        expect(subscription$).toBeTruthy();
    });

    describe('construction', () => {
        it('should should subscribe to the onEvensHubReady event on the EventHubService', () => {
            // Arrange
            const observable = new Observable<any>();
            spyOn(observable, 'subscribe').and.callThrough();
            spyPropertyGetter(eventsHubServiceSpy, 'onEventsHubReady').and.returnValue(observable);

            // Act
            const _serviceUnderTest = new EventsService(loggerMock, eventsHubServiceSpy, mockStore);

            // Assert
            expect(_serviceUnderTest).toBeTruthy();
            expect(observable.subscribe).toHaveBeenCalledTimes(1);
        });
    });

    describe('getServiceReconnected', () => {
        it('should pass through to EventHubService.getServiceReconnected', () => {
            // Arrange

            // Act
            serviceUnderTest.getServiceConnected();

            // Assert
            expect(eventsHubServiceSpy.getServiceConnected).toHaveBeenCalledTimes(1);
        });
    });

    describe('getServiceDisconnected', () => {
        it('should pass through to EventHubService.getServiceDisconnected', () => {
            // Arrange

            // Act
            serviceUnderTest.getServiceDisconnected();

            // Assert
            expect(eventsHubServiceSpy.getServiceDisconnected).toHaveBeenCalledTimes(1);
        });
    });

    describe('start', () => {
        it('should register the event handlers.', () => {
            // Arrange
            spyOn(serviceUnderTest, 'registerHandlers');

            // Act
            serviceUnderTest.start();

            // Assert
            expect(serviceUnderTest.registerHandlers).toHaveBeenCalledTimes(1);
        });
    });

    describe('stop', () => {
        it('should dregister the event handlers.', () => {
            // Arrange
            spyOn(serviceUnderTest, 'deregisterHandlers');

            // Act
            serviceUnderTest.stop();

            // Assert
            expect(serviceUnderTest.deregisterHandlers).toHaveBeenCalledTimes(1);
        });
    });

    describe('handlers', () => {
        const expectedNumberOfRegistrations = 30;

        describe('registerHandlers', () => {
            it('should register the handlers if they are NOT already registered', () => {
                // Arrange

                const hubConnectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['on']);
                spyPropertyGetter(eventsHubServiceSpy, 'connection').and.returnValue(hubConnectionSpy);

                // Act
                serviceUnderTest.registerHandlers();

                // Assert

                expect(serviceUnderTest.handlersRegistered).toBeTrue();
                expect(hubConnectionSpy.on).toHaveBeenCalledTimes(expectedNumberOfRegistrations);
            });

            it('should NOT register the handlers if they are already registered', () => {
                // Arrange
                const hubConnectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['on']);
                spyPropertyGetter(eventsHubServiceSpy, 'connection').and.returnValue(hubConnectionSpy);

                spyOnProperty(serviceUnderTest, 'handlersRegistered', 'get').and.returnValue(true);

                // Act
                serviceUnderTest.registerHandlers();

                // Assert
                expect(hubConnectionSpy.on).not.toHaveBeenCalled();
            });
        });

        describe('deregisterHandlers', () => {
            it('should deregister the handlers if they are already registered', () => {
                // Arrange
                spyOnProperty(serviceUnderTest, 'handlersRegistered', 'get').and.returnValue(true);

                const hubConnectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['off']);
                spyPropertyGetter(eventsHubServiceSpy, 'connection').and.returnValue(hubConnectionSpy);

                // Act
                serviceUnderTest.deregisterHandlers();

                // Assert
                expect(serviceUnderTest.handlersRegistered).toBeTrue();
                expect(hubConnectionSpy.off).toHaveBeenCalledTimes(expectedNumberOfRegistrations);
            });

            it('should NOT deregister the handlers if they are NOT already registered', () => {
                // Arrange
                const hubConnectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['off']);
                spyPropertyGetter(eventsHubServiceSpy, 'connection').and.returnValue(hubConnectionSpy);

                spyOnProperty(serviceUnderTest, 'handlersRegistered', 'get').and.returnValue(false);

                // Act
                serviceUnderTest.deregisterHandlers();

                // Assert
                expect(hubConnectionSpy.off).not.toHaveBeenCalled();
            });
        });

        describe('ParticipantAdded', () => {
            const eventName = 'ParticipantsUpdatedMessage';

            it('should be registered', () => {
                verifyEventHandlerRegistered(eventName);
            });

            it('should set the correct next value of participantAddedSubject when function is called', doneCallback => {
                const testConferenceId = 'TestConferenceId';
                const testParticipant = new ParticipantResponse();
                testParticipant.id = 'TestParticipantId';
                testParticipant.display_name = 'TestParticipantDisplayName';
                testParticipant.linked_participants = [];
                const testParticipantArr = [testParticipant];
                const hubConnectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['on']);
                hubConnectionSpy.on.withArgs(jasmine.any(String), jasmine.any(Function)).and.callFake((eventType: string, func: any) => {
                    if (eventType === eventName) {
                        func(testConferenceId, testParticipantArr);
                    }
                });

                serviceUnderTest.getParticipantsUpdated().subscribe(message => {
                    expect(message.conferenceId).toBe(testConferenceId);
                    expect(message.participants).toEqual(testParticipantArr);
                    doneCallback();
                });

                spyPropertyGetter(eventsHubServiceSpy, 'connection').and.returnValue(hubConnectionSpy);
                serviceUnderTest.registerHandlers();
            });
        });

        describe('EndpointAdded', () => {
            const eventName = 'EndpointsUpdated';

            it('should be registered', () => {
                verifyEventHandlerRegistered(eventName);
            });

            it('should set the correct next value of endpointAddedSubject when function is called', doneCallback => {
                const testConferenceId = 'TestConferenceId';

                const testVideoEndpointResponse = new VideoEndpointResponse();
                testVideoEndpointResponse.id = Guid.create().toString();
                testVideoEndpointResponse.display_name = 'TestDisplayName';
                testVideoEndpointResponse.participants_linked = ['TestDefenceAdvocateUsername@gmail.com'];

                const testUpdateEndpointsDto = new UpdateEndpointsDto();
                testUpdateEndpointsDto.existing_endpoints = [];
                testUpdateEndpointsDto.new_endpoints = [testVideoEndpointResponse];
                testUpdateEndpointsDto.removed_endpoints = [];

                const hubConnectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['on']);
                hubConnectionSpy.on.withArgs(jasmine.any(String), jasmine.any(Function)).and.callFake((eventType: string, func: any) => {
                    if (eventType === eventName) {
                        func(testConferenceId, testUpdateEndpointsDto);
                    }
                });

                serviceUnderTest.getEndpointsUpdated().subscribe(message => {
                    expect(message.conferenceId).toBe(testConferenceId);
                    expect(message.endpoints).toEqual(testUpdateEndpointsDto);
                    doneCallback();
                });

                spyPropertyGetter(eventsHubServiceSpy, 'connection').and.returnValue(hubConnectionSpy);
                serviceUnderTest.registerHandlers();
            });
        });

        describe('HearingDetailsUpdatedMessage', () => {
            const eventName = 'HearingDetailsUpdatedMessage';

            it('should be registered', () => {
                verifyEventHandlerRegistered(eventName);
            });

            it('should handle event', () => {
                const conference = new ConferenceResponse({
                    id: 'TestConferenceId',
                    participants: [],
                    endpoints: []
                });

                const hubConnectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['on']);
                hubConnectionSpy.on.withArgs(jasmine.any(String), jasmine.any(Function)).and.callFake((eventType: string, func: any) => {
                    if (eventType === eventName) {
                        func(conference);
                    }
                });

                serviceUnderTest.getHearingDetailsUpdated().subscribe(message => {
                    expect(message.conference.id).toBe(conference.id);
                });

                spyPropertyGetter(eventsHubServiceSpy, 'connection').and.returnValue(hubConnectionSpy);
                serviceUnderTest.registerHandlers();
            });
        });

        describe('HearingCancelledMessage', () => {
            const eventName = 'HearingCancelledMessage';

            it('should be registered', () => {
                verifyEventHandlerRegistered(eventName);
            });

            it('should handle event', () => {
                const conferenceId = 'TestConferenceId';

                const hubConnectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['on']);
                hubConnectionSpy.on.withArgs(jasmine.any(String), jasmine.any(Function)).and.callFake((eventType: string, func: any) => {
                    if (eventType === eventName) {
                        func(conferenceId);
                    }
                });

                serviceUnderTest.getHearingCancelled().subscribe(message => {
                    expect(message.conferenceId).toBe(conferenceId);
                });

                spyPropertyGetter(eventsHubServiceSpy, 'connection').and.returnValue(hubConnectionSpy);
                serviceUnderTest.registerHandlers();
            });
        });

        function verifyEventHandlerRegistered(eventName: string) {
            // Arrange
            const hubConnectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['on']);
            spyPropertyGetter(eventsHubServiceSpy, 'connection').and.returnValue(hubConnectionSpy);

            // Act
            serviceUnderTest.registerHandlers();

            // Assert
            expect(serviceUnderTest.handlersRegistered).toBeTrue();
            expect(hubConnectionSpy.on).toHaveBeenCalledWith(eventName, jasmine.any(Function));
        }
    });

    describe('send message functions', () => {
        it('sendMessage (instant) - should call send on the hub connection', fakeAsync(() => {
            // Arrange
            const expectedMessageName = 'SendMessage';
            const hubConnectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['send']);

            spyPropertyGetter(eventsHubServiceSpy, 'connection').and.returnValue(hubConnectionSpy);

            const expectedInstantMessage = new InstantMessage({
                conferenceId: Guid.create().toString(),
                id: Guid.create().toString(),
                to: 'test@to.com',
                from: 'other@from.com',
                from_display_name: 'You',
                message: 'i have sent',
                is_user: true,
                timestamp: new Date(new Date().toUTCString())
            });

            // Act
            serviceUnderTest.sendMessage(expectedInstantMessage);
            tick();

            // Assert
            expect(hubConnectionSpy.send).toHaveBeenCalledOnceWith(
                expectedMessageName,
                expectedInstantMessage.conferenceId,
                expectedInstantMessage.message,
                expectedInstantMessage.to,
                expectedInstantMessage.id
            );
        }));

        it('sendMessage (instant) - propagate the error when send fails', async () => {
            // Arrange
            const expectedError = () => new Error('test error');
            const expectedMessageName = 'SendMessage';
            const hubConnectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['send']);
            hubConnectionSpy.send.and.rejectWith(expectedError());

            spyPropertyGetter(eventsHubServiceSpy, 'connection').and.returnValue(hubConnectionSpy);

            const expectedInstantMessage = new InstantMessage({
                conferenceId: Guid.create().toString(),
                id: Guid.create().toString(),
                to: 'test@to.com',
                from: 'other@from.com',
                from_display_name: 'You',
                message: 'i have sent',
                is_user: true,
                timestamp: new Date(new Date().toUTCString())
            });

            // Act
            let error: Error;
            try {
                await serviceUnderTest.sendMessage(expectedInstantMessage);
            } catch (e) {
                error = e;
            }

            // Assert
            expect(error).toEqual(expectedError());
            expect(hubConnectionSpy.send).toHaveBeenCalledOnceWith(
                expectedMessageName,
                expectedInstantMessage.conferenceId,
                expectedInstantMessage.message,
                expectedInstantMessage.to,
                expectedInstantMessage.id
            );
        });

        it('sendHeartbeat', fakeAsync(() => {
            // Arrange
            const expectedMessageName = 'SendHeartbeat';
            const expectedConferenceId = 'test-conference-id';
            const expectedParticipantId = 'test-participant-id';
            const expectedHeartbeat = new Heartbeat();
            const hubConnectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['send']);

            spyPropertyGetter(eventsHubServiceSpy, 'connection').and.returnValue(hubConnectionSpy);

            // Act
            serviceUnderTest.sendHeartbeat(expectedConferenceId, expectedParticipantId, expectedHeartbeat);
            tick();

            // Assert
            expect(hubConnectionSpy.send).toHaveBeenCalledOnceWith(
                expectedMessageName,
                expectedConferenceId,
                expectedParticipantId,
                expectedHeartbeat
            );
        }));

        it('sendTransferRequest', fakeAsync(() => {
            // Arrange
            const expectedMessageName = 'sendTransferRequest';
            const expectedConferenceId = 'test-conference-id';
            const expectedParticipantId = 'test-participant-id';
            const expectedTransferDirection = TransferDirection.In;
            const hubConnectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['send']);

            spyPropertyGetter(eventsHubServiceSpy, 'connection').and.returnValue(hubConnectionSpy);

            // Act
            serviceUnderTest.sendTransferRequest(expectedConferenceId, expectedParticipantId, expectedTransferDirection);
            tick();

            // Assert
            expect(hubConnectionSpy.send).toHaveBeenCalledOnceWith(
                expectedMessageName,
                expectedConferenceId,
                expectedParticipantId,
                expectedTransferDirection
            );
        }));

        it('publishRemoteMuteStatus', fakeAsync(() => {
            // Arrange
            const expectedMessageName = 'UpdateParticipantRemoteMuteStatus';
            const expectedConferenceId = 'test-conference-id';
            const expectedParticipantId = 'test-participant-id';
            const expectedIsRemoteMuted = false;
            const hubConnectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['send']);

            spyPropertyGetter(eventsHubServiceSpy, 'connection').and.returnValue(hubConnectionSpy);

            // Act
            serviceUnderTest.publishRemoteMuteStatus(expectedConferenceId, expectedParticipantId, expectedIsRemoteMuted);
            tick();

            // Assert
            expect(hubConnectionSpy.send).toHaveBeenCalledOnceWith(
                expectedMessageName,
                expectedConferenceId,
                expectedParticipantId,
                expectedIsRemoteMuted
            );
        }));

        it('publishParticipantHandRaisedStatus', fakeAsync(() => {
            // Arrange
            const expectedMessageName = 'UpdateParticipantHandStatus';
            const expectedConferenceId = 'test-conference-id';
            const expectedParticipantId = 'test-participant-id';
            const expectedIsRaised = false;
            const hubConnectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['send']);

            spyPropertyGetter(eventsHubServiceSpy, 'connection').and.returnValue(hubConnectionSpy);

            // Act
            serviceUnderTest.publishParticipantHandRaisedStatus(expectedConferenceId, expectedParticipantId, expectedIsRaised);
            tick();

            // Assert
            expect(hubConnectionSpy.send).toHaveBeenCalledOnceWith(
                expectedMessageName,
                expectedConferenceId,
                expectedParticipantId,
                expectedIsRaised
            );
        }));

        it('updateParticipantLocalMuteStatus', fakeAsync(() => {
            // Arrange
            const expectedMessageName = 'ToggleParticipantLocalMute';
            const expectedConferenceId = 'test-conference-id';
            const expectedParticipantId = 'test-participant-id';
            const expectedIsMuted = false;
            const hubConnectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['send']);

            spyPropertyGetter(eventsHubServiceSpy, 'connection').and.returnValue(hubConnectionSpy);

            // Act
            serviceUnderTest.updateParticipantLocalMuteStatus(expectedConferenceId, expectedParticipantId, expectedIsMuted);
            tick();

            // Assert
            expect(hubConnectionSpy.send).toHaveBeenCalledOnceWith(
                expectedMessageName,
                expectedConferenceId,
                expectedParticipantId,
                expectedIsMuted
            );
        }));

        it('updateAllParticipantLocalMuteStatus', fakeAsync(() => {
            // Arrange
            const expectedMessageName = 'ToggleAllParticipantLocalMute';
            const expectedConferenceId = 'test-conference-id';
            const expectedIsMuted = false;
            const hubConnectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['send']);

            spyPropertyGetter(eventsHubServiceSpy, 'connection').and.returnValue(hubConnectionSpy);

            // Act
            serviceUnderTest.updateAllParticipantLocalMuteStatus(expectedConferenceId, expectedIsMuted);
            tick();

            // Assert
            expect(hubConnectionSpy.send).toHaveBeenCalledOnceWith(expectedMessageName, expectedConferenceId, expectedIsMuted);
        }));

        it('sendMediaStatus', fakeAsync(() => {
            // Arrange
            const expectedMessageName = 'SendMediaDeviceStatus';
            const expectedConferenceId = 'test-conference-id';
            const expectedParticipantId = 'test-participant-id';
            const expectedMediaStatus = new ParticipantMediaStatus(false, false);
            const hubConnectionSpy = jasmine.createSpyObj<signalR.HubConnection>('HubConnection', ['send']);

            spyPropertyGetter(eventsHubServiceSpy, 'connection').and.returnValue(hubConnectionSpy);

            // Act
            serviceUnderTest.sendMediaStatus(expectedConferenceId, expectedParticipantId, expectedMediaStatus);
            tick();

            // Assert
            expect(hubConnectionSpy.send).toHaveBeenCalledOnceWith(
                expectedMessageName,
                expectedConferenceId,
                expectedParticipantId,
                expectedMediaStatus
            );
        }));
    });
});
