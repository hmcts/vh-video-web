import { BehaviorSubject } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    AddSelfTestFailureEventRequest,
    ConferenceResponse,
    SelfTestFailureReason,
    SelfTestPexipResponse,
    TestCallScoreResponse,
    TestScore,
    TokenResponse
} from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaStreamService } from 'src/app/services/user-media-stream.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MediaDeviceTestData } from 'src/app/testing/mocks/data/media-device-test-data';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { SelfTestComponent } from './self-test.component';
import { SelectedUserMediaDevice } from '../models/selected-user-media-device';
import {
    onSetupSubjectMock,
    onConnectedSubjectMock,
    onDisconnectedSubjectMock,
    onErrorSubjectMock,
    videoCallServiceSpy
} from 'src/app/testing/mocks/mock-video-call-service';
import { CallSetup, ConnectedCall, CallError, DisconnectedCall } from 'src/app/waiting-space/models/video-call-models';
import { flushMicrotasks, fakeAsync } from '@angular/core/testing';
import { Url } from 'url';

describe('SelfTestComponent', () => {
    let component: SelfTestComponent;

    const onSetupSubject = onSetupSubjectMock;
    const onConnectedSubject = onConnectedSubjectMock;
    const onDisconnectedSubject = onDisconnectedSubjectMock;
    const onErrorSubject = onErrorSubjectMock;
    const videoCallService = videoCallServiceSpy;

    const logger: Logger = new MockLogger();
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    let errorService: jasmine.SpyObj<ErrorService>;
    let userMediaService: jasmine.SpyObj<UserMediaService>;
    let userMediaStreamService: jasmine.SpyObj<UserMediaStreamService>;
    const pexipConfig = new SelfTestPexipResponse({
        pexip_self_test_node: 'selftest.automated.test'
    });
    const testData = new ConferenceTestData();
    let conference: ConferenceResponse;
    const mediaTestData = new MediaDeviceTestData();

    const token = new TokenResponse({
        expires_on: '02.06.2020-21:06Z',
        token: '3a9643611de98e66979bf9519c33fc8d28c39100a4cdc29aaf1b6041b9e16e45'
    });

    beforeAll(() => {
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getSelfTestToken',
            'getObfuscatedName',
            'getTestCallScore',
            'getIndependentTestCallScore',
            'raiseSelfTestFailureEvent'
        ]);

        errorService = jasmine.createSpyObj<ErrorService>('ErrorService', [
            'goToServiceError',
            'handleApiError',
            'returnHomeIfUnauthorised'
        ]);

        userMediaService = jasmine.createSpyObj<UserMediaService>(
            'UserMediaService',
            ['updatePreferredCamera', 'updatePreferredMicrophone', 'hasMultipleDevices', 'getPreferredCamera', 'getPreferredMicrophone'],
            { connectedDevices: new BehaviorSubject(mediaTestData.getListOfDevices()) }
        );

        userMediaService.getPreferredCamera.and.resolveTo(mediaTestData.getListOfCameras()[0]);
        userMediaService.getPreferredMicrophone.and.resolveTo(mediaTestData.getListOfMicrophones()[0]);

        userMediaStreamService = jasmine.createSpyObj<UserMediaStreamService>('UserMediaStreamService', [
            'requestAccess',
            'stopStream',
            'getStreamForCam',
            'getStreamForMic'
        ]);
        userMediaStreamService.requestAccess.and.returnValue(Promise.resolve(true));
        userMediaStreamService.stopStream.and.callFake(() => {});
    });

    beforeEach(() => {
        conference = testData.getConferenceDetailFuture();
        component = new SelfTestComponent(
            logger,
            videoWebService,
            errorService,
            userMediaService,
            userMediaStreamService,
            videoCallService
        );
        component.conference = conference;
        component.participant = component.conference.participants[0];
        component.selfTestPexipConfig = pexipConfig;
        component.token = token;

        videoWebService.raiseSelfTestFailureEvent.calls.reset();
        videoWebService.getTestCallScore.calls.reset();
        videoWebService.getIndependentTestCallScore.calls.reset();
        videoWebService.getSelfTestToken.and.resolveTo(token);
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should use participant id if provided', () => {
        const testConference = testData.getConferenceDetailNow() as ConferenceResponse;
        testConference.pexip_self_test_node_uri = 'conference.node.selftest';
        const participant = testConference.participants[0];
        component.participant = participant;
        component.conference = testConference;

        component.ngOnInit();

        expect(component.selfTestParticipantId).toBe(participant.id);
        expect(component.selfTestPexipNode).toBe(testConference.pexip_self_test_node_uri);
    });

    it('should generate participant id if not provided', () => {
        component.participant = null;
        component.conference = null;

        component.ngOnInit();

        expect(component.selfTestParticipantId).toBeDefined();
        expect(component.selfTestPexipNode).toBe(pexipConfig.pexip_self_test_node);
    });

    it('should stop stream and display modal when user selects device change', () => {
        const mockMicStream = jasmine.createSpyObj<MediaStream>('MediaStream', ['getAudioTracks']);
        component.preferredMicrophoneStream = mockMicStream;
        component.displayDeviceChangeModal = false;

        component.changeDevices();

        expect(userMediaStreamService.stopStream).toHaveBeenCalledWith(mockMicStream);
        expect(component.displayDeviceChangeModal).toBeTruthy();
    });

    it('should hide modal on cancel', () => {
        component.displayDeviceChangeModal = true;
        component.onMediaDeviceChangeCancelled();
        expect(component.displayDeviceChangeModal).toBeFalsy();
    });

    it('should update preferred devices', async () => {
        component.displayDeviceChangeModal = true;
        const selectedDevices = new SelectedUserMediaDevice(mediaTestData.getListOfCameras()[0], mediaTestData.getListOfMicrophones()[0]);

        await component.onMediaDeviceChangeAccepted(selectedDevices);

        expect(userMediaService.updatePreferredCamera).toHaveBeenCalledWith(selectedDevices.selectedCamera);
        expect(userMediaService.updatePreferredMicrophone).toHaveBeenCalledWith(selectedDevices.selectedMicrophone);
        expect(component.displayDeviceChangeModal).toBeFalsy();
    });

    it('should emit test complete event', () => {
        spyOn(component.testCompleted, 'emit');
        const testCallScoreResponse = new TestCallScoreResponse({
            passed: true,
            score: TestScore.Good
        });
        component.didTestComplete = true;
        component.testCallResult = testCallScoreResponse;

        component.publishTestResult();

        expect(component.testCompleted.emit).toHaveBeenCalledWith(testCallScoreResponse);
    });

    it('should disconnect from pexip when publishing prematurely', () => {
        spyOn(component.testCompleted, 'emit');
        const testCallScoreResponse = null;
        component.didTestComplete = false;
        component.testCallResult = testCallScoreResponse;

        component.publishTestResult();
        expect(videoCallService.disconnectFromCall).toHaveBeenCalled();
    });

    it('should raise failed self test event when test score is bad', async () => {
        component.testCallResult = new TestCallScoreResponse({ passed: false, score: TestScore.Bad });
        await component.ngOnDestroy();
        const request = new AddSelfTestFailureEventRequest({
            self_test_failure_reason: SelfTestFailureReason.BadScore
        });
        expect(videoWebService.raiseSelfTestFailureEvent).toHaveBeenCalledWith(component.conference.id, request);
    });

    it('should not raise failed self test event when test is incomplete', async () => {
        component.testCallResult = null;
        await component.ngOnDestroy();
        expect(videoWebService.raiseSelfTestFailureEvent).not.toHaveBeenCalled();
    });

    it('should not raise failed self test event when score has already been sent', async () => {
        component.scoreSent = true;
        await component.ngOnDestroy();
        expect(videoWebService.raiseSelfTestFailureEvent).toHaveBeenCalledTimes(0);
    });

    it('should retrive self test score for conference and participant', async () => {
        component.conference = new ConferenceTestData().getConferenceNow();
        component.participant = component.conference.participants[0];
        await component.retrieveSelfTestScore();
        expect(videoWebService.getTestCallScore).toHaveBeenCalledTimes(1);
    });

    it('should retrive independent self test score as a conference and participant are null', async () => {
        component.conference = null;
        component.participant = null;
        await component.retrieveSelfTestScore();
        expect(videoWebService.getIndependentTestCallScore).toHaveBeenCalledTimes(1);
    });

    it('should terminate streams on disconnect', () => {
        component.incomingStream = jasmine.createSpyObj<MediaStream>('MediaStream', ['getVideoTracks']);
        component.outgoingStream = jasmine.createSpyObj<MediaStream>('MediaStream', ['getVideoTracks']);
        component.didTestComplete = false;
        component.displayFeed = true;

        component.disconnect();

        expect(videoCallService.disconnectFromCall).toHaveBeenCalled();
        expect(component.incomingStream).toBeNull();
        expect(component.outgoingStream).toBeNull();
        expect(component.didTestComplete).toBeTruthy();
        expect(component.displayFeed).toBeFalsy();
    });

    it('should call node on replay', () => {
        component.replayVideo();

        expect(videoCallService.disconnectFromCall).toHaveBeenCalled();
        expect(videoCallService.makeCall).toHaveBeenCalled();
    });

    it('should init pexip setup to be called on start', () => {
        component.setupPexipClient();
        expect(videoCallService.setupClient).toHaveBeenCalled();
    });

    it('should define outgoing stream when video call has been setup', () => {
        const outgoingStream = <any>{};
        const payload = new CallSetup(outgoingStream);

        component.setupPexipClient();
        onSetupSubject.next(payload);

        expect(videoCallService.connect).toHaveBeenCalled();
        expect(component.outgoingStream).toBeDefined();
    });

    it('should define incoming stream when video call has connected', () => {
        const mockedDocElement = document.createElement('div');
        document.getElementById = jasmine.createSpy('incomingFeed').and.returnValue(mockedDocElement);
        spyOn(component.testStarted, 'emit');
        spyOnProperty(window, 'navigator').and.returnValue({
            userAgent: 'Chrome'
        });
        const incomingStream = <any>{};

        component.setupPexipClient();
        const payload = new ConnectedCall(incomingStream);

        onConnectedSubject.next(payload);

        expect(component.incomingStream).toBeDefined();
        expect(component.displayFeed).toBeTruthy();
        expect(component.testStarted.emit).toHaveBeenCalled();
    });

    it('should hide video when video call failed', () => {
        const payload = new CallError('test failure intentional');

        component.setupPexipClient();
        onErrorSubject.next(payload);

        expect(component.displayFeed).toBeFalsy();
        expect(errorService.goToServiceError).toHaveBeenCalledWith('Your connection was lost');
    });

    it('should hide video when video call has disconnected', () => {
        const payload = new DisconnectedCall('test failure intentional');

        component.setupPexipClient();
        onDisconnectedSubject.next(payload);

        expect(component.displayFeed).toBeFalsy();
    });

    it('should hide video and get self test score when test has ended as expected', () => {
        const payload = new DisconnectedCall('Conference terminated by another participant');

        component.setupPexipClient();
        onDisconnectedSubject.next(payload);

        expect(component.displayFeed).toBeFalsy();
        expect(videoWebService.getTestCallScore).toHaveBeenCalled();
    });

    it('should raise failed self-test event when score is bad', fakeAsync(() => {
        videoWebService.getTestCallScore.and.resolveTo(
            new TestCallScoreResponse({
                passed: false,
                score: TestScore.Bad
            })
        );
        component.scoreSent = false;
        const payload = new DisconnectedCall('Conference terminated by another participant');

        component.setupPexipClient();
        onDisconnectedSubject.next(payload);
        flushMicrotasks();

        expect(component.displayFeed).toBeFalsy();
        expect(videoWebService.raiseSelfTestFailureEvent).toHaveBeenCalled();
    }));

    it('should make call to video conference and disable H264 on firefox ', async () => {
        spyOnProperty(window, 'navigator').and.returnValue({
            userAgent: 'FireFox'
        });
        await component.call();
        expect(videoCallService.enableH264).toHaveBeenCalledWith(false);
    });

    it('should return false when no streams are active', () => {
        component.outgoingStream = undefined;
        component.incomingStream = undefined;
        expect(component.streamsActive).toBeFalsy();
    });

    it('should return true when streams are active', () => {
        component.outgoingStream = jasmine.createSpyObj<MediaStream>('MediaStream', ['getVideoTracks']);
        component.incomingStream = jasmine.createSpyObj<MediaStream>('MediaStream', ['getVideoTracks']);
        expect(component.streamsActive).toBeTruthy();
    });

    it('should return true when streams are active urls', () => {
        component.outgoingStream = new URL('http://www.test.com');
        component.incomingStream = new URL('http://www.test.com');
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
