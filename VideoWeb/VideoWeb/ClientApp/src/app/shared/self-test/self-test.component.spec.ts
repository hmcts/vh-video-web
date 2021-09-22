import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaService } from 'src/app/services/user-media.service';
import { SelfTestComponent } from './self-test.component';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { UserMediaDevice } from '../models/user-media-device';
import { of, Subject } from 'rxjs';
import { getSpiedPropertyGetter } from '../jasmine-helpers/property-helpers';
import { fakeAsync, flush } from '@angular/core/testing';
import {
    AddSelfTestFailureEventRequest,
    ConferenceResponse,
    ParticipantResponse,
    Role,
    SelfTestFailureReason,
    SelfTestPexipResponse,
    TestCallScoreResponse,
    TestScore,
    TokenResponse
} from 'src/app/services/clients/api-client';
import { Guid } from 'guid-typescript';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { CallError, CallSetup, ConnectedCall, DisconnectedCall } from 'src/app/waiting-space/models/video-call-models';
import { mockMicStream } from 'src/app/waiting-space/waiting-room-shared/tests/waiting-room-base-setup';
import { MediaDeviceTestData } from 'src/app/testing/mocks/data/media-device-test-data';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { VideoFilterService } from 'src/app/services/video-filter.service';

describe('SelfTestComponent', () => {
    let component: SelfTestComponent;

    let loggerSpy: jasmine.SpyObj<Logger>;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;

    let userMediaServiceSpy: jasmine.SpyObj<UserMediaService>;
    let connectedDevicesSubject: Subject<UserMediaDevice[]>;
    let activateMicrophoneSubject: Subject<MediaStream>;

    let userMediaStreamServiceSpy: jasmine.SpyObj<UserMediaStreamService>;
    let videoCallServiceSpy: jasmine.SpyObj<VideoCallService>;
    let videoFilterServiceSpy: jasmine.SpyObj<VideoFilterService>;
    let navigatorSpy: jasmine.SpyObj<Navigator>;

    const token = new TokenResponse({
        expires_on: '02.06.2020-21:06Z',
        token: '3a9643611de98e66979bf9519c33fc8d28c39100a4cdc29aaf1b6041b9e16e45'
    });

    beforeEach(() => {
        loggerSpy = jasmine.createSpyObj<Logger>(['debug', 'info', 'warn', 'error']);

        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getSelfTestToken',
            'getObfuscatedName',
            'getTestCallScore',
            'getIndependentTestCallScore',
            'raiseSelfTestFailureEvent'
        ]);

        errorServiceSpy = jasmine.createSpyObj<ErrorService>(['handleApiError', 'handlePexipError']);

        userMediaServiceSpy = jasmine.createSpyObj<UserMediaService>(['hasMultipleDevices'], ['connectedDevices$']);
        userMediaServiceSpy.hasMultipleDevices.and.returnValue(of(true));

        connectedDevicesSubject = new Subject<UserMediaDevice[]>();
        activateMicrophoneSubject = new Subject<MediaStream>();
        getSpiedPropertyGetter(userMediaServiceSpy, 'connectedDevices$').and.returnValue(connectedDevicesSubject.asObservable());

        userMediaStreamServiceSpy = jasmine.createSpyObj<UserMediaStreamService>([], ['activeMicrophoneStream$']);
        getSpiedPropertyGetter(userMediaStreamServiceSpy, 'activeMicrophoneStream$').and.returnValue(
            activateMicrophoneSubject.asObservable()
        );

        videoCallServiceSpy = jasmine.createSpyObj<VideoCallService>([
            'onCallConnected',
            'onCallDisconnected',
            'onCallSetup',
            'onError',
            'setupClient',
            'connect',
            'enableH264',
            'makeCall',
            'disconnectFromCall'
        ]);

        videoFilterServiceSpy = jasmine.createSpyObj<VideoFilterService>(['doesSupportVideoFiltering']);
        videoFilterServiceSpy.doesSupportVideoFiltering.and.returnValue(false);

        navigatorSpy = jasmine.createSpyObj<Navigator>([], ['userAgent']);

        component = new SelfTestComponent(
            loggerSpy,
            videoWebServiceSpy,
            errorServiceSpy,
            userMediaServiceSpy,
            userMediaStreamServiceSpy,
            videoFilterServiceSpy,
            videoCallServiceSpy,
            navigatorSpy
        );
    });

    describe('ngOnInit', () => {
        it('should initialise self test data', () => {
            // Arrange
            const initialiseDataSpy = spyOn(component, 'initialiseData');

            // Act
            component.ngOnInit();

            // Assert
            expect(initialiseDataSpy).toHaveBeenCalledTimes(1);
        });

        it('should initialise showChangeDevices to the true when video filters is supported', () => {
            // Arrange
            spyOn(component, 'initialiseData');
            videoFilterServiceSpy.doesSupportVideoFiltering.and.returnValue(true);

            // Act
            component.ngOnInit();

            // Arrange
            expect(component.showChangeDevices).toBeTrue();
        });

        it('should initialise showChangeDevices to the false when video filters is NOT supported', () => {
            // Arrange
            spyOn(component, 'initialiseData');
            videoFilterServiceSpy.doesSupportVideoFiltering.and.returnValue(false);

            // Act
            component.ngOnInit();

            // Arrange
            expect(component.showChangeDevices).toBeFalse();
        });

        describe('on connectedDevices$', () => {
            it('should setup subscribers, configure and make call; additionally only handle once', fakeAsync(() => {
                // Arrange
                spyOn(component, 'initialiseData');
                const setupSubscribersSpy = spyOn(component, 'setupSubscribers');
                const setupTestAndCallSpy = spyOn(component, 'setupTestAndCall');

                // Act
                component.ngOnInit();
                connectedDevicesSubject.next([]);
                flush();
                connectedDevicesSubject.next([]);
                flush();

                // Assert
                expect(setupSubscribersSpy).toHaveBeenCalledTimes(1);
                expect(setupTestAndCallSpy).toHaveBeenCalledTimes(1);
            }));

            it('should handle an error and call the error service', fakeAsync(() => {
                // Arrange
                spyOn(component, 'initialiseData');

                // Act
                component.ngOnInit();
                connectedDevicesSubject.error(new Error());
                flush();

                // Assert
                expect(errorServiceSpy.handlePexipError).toHaveBeenCalledTimes(1);
            }));

            it('should setup subscribers', fakeAsync(() => {
                // Arrange
                userMediaServiceSpy.hasMultipleDevices.and.returnValue(of(true));

                // Act
                component.setupSubscribers();
                activateMicrophoneSubject.next(mockMicStream);
                flush();

                // Assert
                expect(component.preferredMicrophoneStream).toEqual(mockMicStream);
                expect(component.showChangeDevices).toBeTrue();
            }));
        });
    });

    describe('initialiseData', () => {
        it('should use the participant ID if the participant is set', () => {
            // Arrange
            component.conference = new ConferenceResponse();

            const expectedSelfTestId = Guid.create().toString();
            component.participant = new ParticipantResponse();
            component.participant.id = expectedSelfTestId;

            // Act
            component.initialiseData();

            // Assert
            expect(component.selfTestParticipantId).toEqual(expectedSelfTestId);
        });

        it('should generate a guid if the participant is null', () => {
            // Arrange
            component.conference = new ConferenceResponse();

            component.participant = null;

            // Act
            component.initialiseData();

            // Assert
            expect(component.selfTestParticipantId).toBeTruthy();
            expect(Guid.parse(component.selfTestParticipantId)).toBeTruthy();
        });

        it('should generate a guid if the participant is undefined', () => {
            // Arrange
            component.conference = new ConferenceResponse();

            component.participant = undefined;

            // Act
            component.initialiseData();

            // Assert
            expect(component.selfTestParticipantId).toBeTruthy();
            expect(Guid.parse(component.selfTestParticipantId)).toBeTruthy();
        });

        it('should use the self test node uri if the conference is set', () => {
            // Arrange
            const expectedNode = 'pexip-node';

            component.conference = new ConferenceResponse();
            component.conference.pexip_self_test_node_uri = expectedNode;

            // Act
            component.initialiseData();

            // Assert
            expect(component.selfTestPexipNode).toEqual(expectedNode);
        });

        it('should use the selfTestPexipConfig if the conference is null', () => {
            // Arrange
            const expectedNode = 'pexip-node';
            component.selfTestPexipConfig = new SelfTestPexipResponse();
            component.selfTestPexipConfig.pexip_self_test_node = expectedNode;

            component.conference = null;

            // Act
            component.initialiseData();

            // Assert
            expect(component.selfTestParticipantId).toBeTruthy();
            expect(Guid.parse(component.selfTestParticipantId)).toBeTruthy();
        });

        it('should the selfTestPexipConfig if the conference is undefined', () => {
            // Arrange
            const expectedNode = 'pexip-node';
            component.selfTestPexipConfig = new SelfTestPexipResponse();
            component.selfTestPexipConfig.pexip_self_test_node = expectedNode;

            component.conference = undefined;

            // Act
            component.initialiseData();

            // Assert
            expect(component.selfTestParticipantId).toBeTruthy();
            expect(Guid.parse(component.selfTestParticipantId)).toBeTruthy();
        });
    });

    describe('streamsActive', () => {
        it('should return false when no streams are active', () => {
            component.outgoingStream = undefined;
            component.incomingStream = undefined;
            expect(component.streamsActive).toBeFalsy();
        });

        it('should return false when no streams are active', () => {
            component.outgoingStream = undefined;
            component.incomingStream = jasmine.createSpyObj<MediaStream>('MediaStream', ['getVideoTracks']);
            expect(component.streamsActive).toBeFalsy();
        });

        it('should return false when no streams are active', () => {
            component.outgoingStream = jasmine.createSpyObj<MediaStream>('MediaStream', ['getVideoTracks']);
            component.incomingStream = undefined;
            expect(component.streamsActive).toBeFalsy();
        });

        it('should return true when streams are active', () => {
            component.outgoingStream = jasmine.createSpyObj<MediaStream>('MediaStream', ['getVideoTracks']);
            component.incomingStream = jasmine.createSpyObj<MediaStream>('MediaStream', ['getVideoTracks']);
            expect(component.streamsActive).toBeTruthy();
        });

        it('should return true when streams are active urls', () => {
            component.outgoingStream = new URL('http://www.hmcts.net');
            component.incomingStream = new URL('http://www.hmcts.net');
            expect(component.streamsActive).toBeTruthy();
        });

        it('should return false when outgoing stream is inactive', () => {
            component.outgoingStream = undefined;
            component.incomingStream = jasmine.createSpyObj<MediaStream>('MediaStream', ['getVideoTracks']);
            expect(component.streamsActive).toBeFalsy();
        });

        it('should return false when incoming stream is inactive', () => {
            component.outgoingStream = jasmine.createSpyObj<MediaStream>('MediaStream', ['getVideoTracks']);
            component.incomingStream = undefined;
            expect(component.streamsActive).toBeFalsy();
        });
    });

    describe('changeDevices', () => {
        it('should set displayDeviceChangeModal to true', () => {
            // Arrange
            spyOn(component, 'disconnect');

            // Act
            component.changeDevices();

            // Assert
            expect(component.displayDeviceChangeModal).toBeTrue();
        });
    });

    describe('onSelectMediaDeviceShouldClose', () => {
        it('should set displayDeviceChangeModal to false', () => {
            // Arrange
            spyOn(component, 'call');

            // Act
            component.onSelectMediaDeviceShouldClose();

            // Assert
            expect(component.displayDeviceChangeModal).toBeFalse();
        });

        describe('on activeMicrophoneStream$', () => {
            beforeEach(() => {
                component.setupSubscribers();
            });

            it('should set the preferredMicrophoneStream stream', fakeAsync(() => {
                // Act
                activateMicrophoneSubject.next(mockMicStream);
                flush();

                // Assert
                expect(component.preferredMicrophoneStream).toEqual(mockMicStream);
            }));
        });
    });

    describe('call', () => {
        beforeEach(() => {
            component.token = token;
            getSpiedPropertyGetter(navigatorSpy, 'userAgent').and.returnValue('chrome');
        });

        it('should set didTestComplete to false', () => {
            // Arrange
            component.didTestComplete = true;

            // Act
            component.call();

            // Assert
            expect(component.didTestComplete).toBeFalse();
        });

        it('should call makeCall', fakeAsync(() => {
            // Arrange
            const expectedSelfTestNode = 'pexip-node';
            const conferenceAlias = 'testcall2';
            const selfTestParticipantId = 'participant-id';
            const maxBandwidth = 1234;

            const encodedTokenOptions = btoa(`${token.expires_on};${selfTestParticipantId};${token.token}`);
            const expectedPexipConferenceAlias = `${conferenceAlias};${encodedTokenOptions}`;
            const expectedParticipantDisplayName = selfTestParticipantId;
            const expectedMaxBandwidth = maxBandwidth;

            component.token = token;
            component.selfTestParticipantId = selfTestParticipantId;
            component.selfTestPexipNode = expectedSelfTestNode;
            component.maxBandwidth = maxBandwidth;

            // Act
            component.call();
            flush();

            // Assert
            expect(videoCallServiceSpy.makeCall).toHaveBeenCalledOnceWith(
                expectedSelfTestNode,
                expectedPexipConferenceAlias,
                expectedParticipantDisplayName,
                expectedMaxBandwidth
            );
        }));

        it('should disable h264 if the userAgent contains firefox', () => {
            // Arrange
            getSpiedPropertyGetter(navigatorSpy, 'userAgent').and.returnValue('afirefoxa');

            // Act
            component.call();

            // Assert
            expect(videoCallServiceSpy.enableH264).toHaveBeenCalledOnceWith(false);
        });

        it('should NOT disable h264 if the userAgent does NOT contain firefox', () => {
            // Act
            component.call();

            // Assert
            expect(videoCallServiceSpy.enableH264).not.toHaveBeenCalled();
        });
    });

    describe('replayVideo', () => {
        it('should disconnect and reconnect', () => {
            // Arrange
            const disconnectSpy = spyOn(component, 'disconnect');
            const callSpy = spyOn(component, 'call');

            // Act
            component.replayVideo();

            // Arrange
            expect(disconnectSpy).toHaveBeenCalledTimes(1);
            expect(callSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('disconnect', () => {
        it('should disconnect from the call and clean up', () => {
            // Arrange
            const closeMicStreamSpy = spyOn(component, 'closeMicStreams');

            // Act
            component.disconnect();

            // Arrange
            expect(videoCallServiceSpy.disconnectFromCall).toHaveBeenCalledTimes(1);
            expect(closeMicStreamSpy).toHaveBeenCalledTimes(1);
            expect(component.incomingStream).toBeFalsy();
            expect(component.outgoingStream).toBeFalsy();
        });

        it('should handle any errors and clean up', () => {
            // Arrange
            const closeMicStreamSpy = spyOn(component, 'closeMicStreams');
            videoCallServiceSpy.disconnectFromCall.and.throwError(new Error());

            // Act
            component.disconnect();

            // Arrange
            expect(videoCallServiceSpy.disconnectFromCall).toHaveBeenCalledTimes(1);
            expect(closeMicStreamSpy).toHaveBeenCalledTimes(1);
            expect(component.incomingStream).toBeFalsy();
            expect(component.outgoingStream).toBeFalsy();
        });
    });

    describe('closeMicStreams', () => {
        it('should set preferred microphone to null', () => {
            // Arrange
            const stream = new MediaStream();
            component.preferredMicrophoneStream = stream;

            // Act
            component.closeMicStreams();

            // Assert
            expect(component.preferredMicrophoneStream).toBeNull();
        });
    });

    describe('publishTestResult', () => {
        it('should emit test complete event', () => {
            // Arrange
            spyOn(component.testCompleted, 'emit');
            const testCallScoreResponse = new TestCallScoreResponse({
                passed: true,
                score: TestScore.Good
            });
            component.didTestComplete = true;
            component.testCallResult = testCallScoreResponse;

            // Act
            component.publishTestResult();

            // Assert
            expect(component.testCompleted.emit).toHaveBeenCalledWith(testCallScoreResponse);
        });
    });

    describe('retrieveSelfTestScore', () => {
        it('should retrive self test score for conference and participant', fakeAsync(() => {
            // Arrange
            spyOn(component.testCompleted, 'emit');
            component.conference = new ConferenceTestData().getConferenceNow();
            component.participant = component.conference.participants[0];

            const publishTestResultSpy = spyOn(component, 'publishTestResult');

            // Act
            component.retrieveSelfTestScore();
            flush();

            // Assert
            expect(publishTestResultSpy).toHaveBeenCalledTimes(1);
            expect(videoWebServiceSpy.getTestCallScore).toHaveBeenCalledTimes(1);
        }));

        it('should call raiseFailedSelfTest if the result from self test score is bad', fakeAsync(() => {
            // Arrange
            const result = new TestCallScoreResponse();
            result.score = TestScore.Bad;

            spyOn(component.testCompleted, 'emit');
            component.conference = new ConferenceTestData().getConferenceNow();
            component.participant = component.conference.participants[0];

            const raiseFailedSelfTestSpy = spyOn(component, 'raiseFailedSelfTest');
            const publishTestResultSpy = spyOn(component, 'publishTestResult');
            videoWebServiceSpy.getTestCallScore.and.resolveTo(result);

            // Act
            component.retrieveSelfTestScore();
            flush();

            // Assert
            expect(publishTestResultSpy).toHaveBeenCalledTimes(1);
            expect(raiseFailedSelfTestSpy).toHaveBeenCalledOnceWith(SelfTestFailureReason.BadScore);
            expect(videoWebServiceSpy.getTestCallScore).toHaveBeenCalledTimes(1);
        }));

        it('should retrive independent self test score as a conference and participant are null', fakeAsync(() => {
            // Arrange
            component.conference = null;
            component.participant = null;

            const publishTestResultSpy = spyOn(component, 'publishTestResult');

            // Act
            component.retrieveSelfTestScore();
            flush();

            // Assert
            expect(publishTestResultSpy).toHaveBeenCalledTimes(1);
            expect(videoWebServiceSpy.getIndependentTestCallScore).toHaveBeenCalledTimes(1);
        }));

        it('should call raiseFailedSelfTest if the result from independent self test score is bad', fakeAsync(() => {
            // Arrange
            const result = new TestCallScoreResponse();
            result.score = TestScore.Bad;

            component.conference = null;
            component.participant = null;

            const raiseFailedSelfTestSpy = spyOn(component, 'raiseFailedSelfTest');
            const publishTestResultSpy = spyOn(component, 'publishTestResult');
            videoWebServiceSpy.getIndependentTestCallScore.and.resolveTo(result);

            // Act
            component.retrieveSelfTestScore();
            flush();

            // Assert
            expect(publishTestResultSpy).toHaveBeenCalledTimes(1);
            expect(raiseFailedSelfTestSpy).toHaveBeenCalledOnceWith(SelfTestFailureReason.BadScore);
            expect(videoWebServiceSpy.getIndependentTestCallScore).toHaveBeenCalledTimes(1);
        }));
    });

    describe('raiseFailedSelfTest', () => {
        let expectedRequest: AddSelfTestFailureEventRequest;

        beforeEach(() => {
            expectedRequest = new AddSelfTestFailureEventRequest({
                self_test_failure_reason: SelfTestFailureReason.BadScore
            });

            component.scoreSent = false;
            component.conference = new ConferenceTestData().getConferenceDetailNow();
            component.participant = component.conference.participants[0];
        });

        it('should do nothing if the score has already been sent', fakeAsync(() => {
            // Arrange
            component.scoreSent = true;

            // Act
            component.raiseFailedSelfTest(expectedRequest.self_test_failure_reason);
            flush();

            // Assert
            expect(component.scoreSent).toBeTrue();
            expect(videoWebServiceSpy.raiseSelfTestFailureEvent).not.toHaveBeenCalled();
        }));

        it('should raise a self test failure event if the conference exists and the participant is NOT a judge', fakeAsync(() => {
            // Arrange
            component.participant.role = Role.Individual;

            // Act
            component.raiseFailedSelfTest(expectedRequest.self_test_failure_reason);
            flush();

            // Assert
            expect(component.scoreSent).toBeTrue();
            expect(videoWebServiceSpy.raiseSelfTestFailureEvent).toHaveBeenCalledOnceWith(component.conference.id, expectedRequest);
        }));

        it('should NOT raise a self test failure event if the conference exists and the participant is a judge', fakeAsync(() => {
            // Arrange
            component.participant.role = Role.Judge;

            // Act
            component.raiseFailedSelfTest(expectedRequest.self_test_failure_reason);
            flush();

            // Assert
            expect(component.scoreSent).toBeFalse();
            expect(videoWebServiceSpy.raiseSelfTestFailureEvent).not.toHaveBeenCalled();
        }));
    });

    describe('setupTestAndCall', () => {
        const selfTestParticipantId = 'participant-id';
        let callSpy: jasmine.Spy<() => Promise<void>>;
        let setupPexipClientSpy: jasmine.Spy<() => Promise<void>>;

        beforeEach(() => {
            component.selfTestParticipantId = selfTestParticipantId;
            callSpy = spyOn(component, 'call');
            setupPexipClientSpy = spyOn(component, 'setupPexipClient');
        });

        it('should set up the pexip client; get the self test token and call... call', fakeAsync(() => {
            // Act
            component.setupTestAndCall();
            flush();

            // Assert
            expect(setupPexipClientSpy).toHaveBeenCalledTimes(1);
            expect(videoWebServiceSpy.getSelfTestToken).toHaveBeenCalledOnceWith(selfTestParticipantId);
            expect(callSpy).toHaveBeenCalledTimes(1);
        }));

        it('should raise an api error if it fails to get the self test token', fakeAsync(() => {
            // Arrange
            const error = new Error();
            videoWebServiceSpy.getSelfTestToken.and.rejectWith(error);

            // Act
            component.setupTestAndCall();
            flush();

            // Assert
            expect(setupPexipClientSpy).toHaveBeenCalledTimes(1);
            expect(videoWebServiceSpy.getSelfTestToken).toHaveBeenCalledOnceWith(selfTestParticipantId);
            expect(errorServiceSpy.handleApiError).toHaveBeenCalledWith(error);
            expect(callSpy).not.toHaveBeenCalled();
        }));
    });

    describe('ngOnDestroy', () => {
        let disconnectSpy: jasmine.Spy<() => void>;
        beforeEach(() => {
            component.conference = new ConferenceTestData().getConferenceDetailNow();
            component.participant = component.conference.participants[0];
            disconnectSpy = spyOn(component, 'disconnect');
        });

        it('should raise failed self test event when test score is bad', fakeAsync(() => {
            // Arrange
            const request = new AddSelfTestFailureEventRequest({
                self_test_failure_reason: SelfTestFailureReason.BadScore
            });

            component.testCallResult = new TestCallScoreResponse({ passed: false, score: TestScore.Bad });

            // Act
            component.ngOnDestroy();
            flush();

            // Assert
            expect(disconnectSpy).toHaveBeenCalledTimes(1);
            expect(videoWebServiceSpy.raiseSelfTestFailureEvent).toHaveBeenCalledWith(component.conference.id, request);
        }));

        it('should not raise failed self test event when test is incomplete', fakeAsync(() => {
            // Arrange
            component.testCallResult = null;

            // Act
            component.ngOnDestroy();
            flush();

            // Assert
            expect(disconnectSpy).toHaveBeenCalledTimes(1);
            expect(videoWebServiceSpy.raiseSelfTestFailureEvent).not.toHaveBeenCalled();
        }));

        it('should not raise failed self test event when score has already been sent', fakeAsync(() => {
            // Arramge
            component.scoreSent = true;

            // Act
            component.ngOnDestroy();
            flush();

            // Assert
            expect(disconnectSpy).toHaveBeenCalledTimes(1);
            expect(videoWebServiceSpy.raiseSelfTestFailureEvent).not.toHaveBeenCalled();
        }));
    });

    describe('on handleCallSetup', () => {
        it('should set the stream and connect the call', () => {
            // Arrange
            const expectedPin = '0000';
            const expectedExt = null;
            const stream = new MediaStream();
            const callSetup = new CallSetup(stream);

            // Act
            component.handleCallSetup(callSetup);

            // Assert
            expect(component.outgoingStream).toBe(stream);
            expect(videoCallServiceSpy.connect).toHaveBeenCalledOnceWith(expectedPin, expectedExt);
        });
    });

    describe('on handleCallConnected', () => {
        it('should set the incoming stream and display the feed and emit the test started event', () => {
            // Arrange
            const testStartedEmitterSpy = spyOn(component.testStarted, 'emit');
            component.displayFeed = false;

            const stream = new MediaStream();

            // Act
            component.handleCallConnected(new ConnectedCall(stream));

            // Assert
            expect(component.displayFeed).toBeTrue();
            expect(component.incomingStream).toBe(stream);
            expect(testStartedEmitterSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('on handleCallError', () => {
        it('should hide the feed and raise a pexip error', () => {
            // Arrange
            component.displayFeed = true;

            // Act
            component.handleCallError(new CallError('error'));
            // Assert
            expect(component.displayFeed).toBeFalse();
            expect(errorServiceSpy.handlePexipError).toHaveBeenCalledTimes(1);
        });
    });

    describe('on handleCallDisconnect', () => {
        it('should hide the feed', fakeAsync(() => {
            // Arrange
            const retrieveSelfTestScoreSpy = spyOn(component, 'retrieveSelfTestScore');

            // Act
            component.handleCallDisconnect(new DisconnectedCall(''));
            flush();

            // Assert
            expect(component.displayFeed).toBeFalse();
            expect(retrieveSelfTestScoreSpy).not.toHaveBeenCalled();
        }));

        it('should retrieve self test score when disconnect reason is Conference terminated by another participant', fakeAsync(() => {
            // Arrange
            const reason = 'Conference terminated by another participant';

            const retrieveSelfTestScoreSpy = spyOn(component, 'retrieveSelfTestScore');

            // Act
            component.handleCallDisconnect(new DisconnectedCall(reason));
            flush();

            // Assert
            expect(retrieveSelfTestScoreSpy).toHaveBeenCalledTimes(1);
        }));
    });
});
