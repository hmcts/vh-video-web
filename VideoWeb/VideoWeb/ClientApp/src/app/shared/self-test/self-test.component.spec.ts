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

describe('SelfTestComponent', () => {
    let component: SelfTestComponent;
    const logger: Logger = new MockLogger();
    let videoWebService: jasmine.SpyObj<VideoWebService>;
    let errorService: jasmine.SpyObj<ErrorService>;
    let userMediaService: jasmine.SpyObj<UserMediaService>;
    let pexipSpy: any;
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
        pexipSpy = jasmine.createSpyObj('pexipAPI', [
            'onSetup',
            'connect',
            'disconnect',
            'onConnect',
            'onError',
            'onDisconnect',
            'makeCall'
        ]);
    });

    beforeEach(() => {
        conference = testData.getConferenceDetailFuture();
        component = new SelfTestComponent(logger, videoWebService, errorService, userMediaService, userMediaStreamService);
        component.pexipAPI = pexipSpy;
        component.conference = conference;
        component.participant = component.conference.participants[0];
        component.selfTestPexipConfig = pexipConfig;
        component.token = token;

        spyOn(component, 'setupPexipClient').and.callFake(() => (component.pexipAPI = pexipSpy));
        videoWebService.raiseSelfTestFailureEvent.calls.reset();
        videoWebService.getTestCallScore.calls.reset();
        videoWebService.getIndependentTestCallScore.calls.reset();
        videoWebService.getSelfTestToken.and.resolveTo(token);
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
        spyOn(component, 'disconnect');
        const testCallScoreResponse = null;
        component.didTestComplete = false;
        component.testCallResult = testCallScoreResponse;

        component.publishTestResult();
        expect(component.disconnect).toHaveBeenCalled();
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

        expect(pexipSpy.disconnect).toHaveBeenCalled();
        expect(component.incomingStream).toBeNull();
        expect(component.outgoingStream).toBeNull();
        expect(component.didTestComplete).toBeTruthy();
        expect(component.displayFeed).toBeFalsy();
    });

    it('should call node on replay', () => {
        component.replayVideo();

        expect(pexipSpy.disconnect).toHaveBeenCalled();
        expect(pexipSpy.makeCall).toHaveBeenCalled();
    });
});
