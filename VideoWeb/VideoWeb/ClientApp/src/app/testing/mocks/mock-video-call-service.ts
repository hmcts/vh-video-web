import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { Subject } from 'rxjs';
import { CallSetup, ConnectedCall, DisconnectedCall, CallError, ParticipantUpdated } from 'src/app/waiting-space/models/video-call-models';

export let videoCallServiceSpy: jasmine.SpyObj<VideoCallService>;

export const onSetupSubjectMock = new Subject<CallSetup>();
export const onConnectedSubjectMock = new Subject<ConnectedCall>();
export const onDisconnectedSubjectMock = new Subject<DisconnectedCall>();
export const onErrorSubjectMock = new Subject<CallError>();
export const onParticipantUpdatedMock = new Subject<ParticipantUpdated>();

videoCallServiceSpy = jasmine.createSpyObj<VideoCallService>('VideoCallService', [
    'setupClient',
    'makeCall',
    'disconnectFromCall',
    'connect',
    'onCallSetup',
    'onCallConnected',
    'onCallDisconnected',
    'onParticipantUpdated',
    'onError',
    'updateCameraForCall',
    'updateMicrophoneForCall',
    'toggleMute',
    'enableH264',
    'raiseHand',
    'lowerHand',
    'startHearing'
]);

videoCallServiceSpy.onCallSetup.and.returnValue(onSetupSubjectMock.asObservable());
videoCallServiceSpy.onCallConnected.and.returnValue(onConnectedSubjectMock.asObservable());
videoCallServiceSpy.onCallDisconnected.and.returnValue(onDisconnectedSubjectMock.asObservable());
videoCallServiceSpy.onError.and.returnValue(onErrorSubjectMock.asObservable());
videoCallServiceSpy.onParticipantUpdated.and.returnValue(onParticipantUpdatedMock.asObservable());
