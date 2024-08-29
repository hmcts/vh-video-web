import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { Subject } from 'rxjs';
import {
    CallSetup,
    ConnectedCall,
    DisconnectedCall,
    CallError,
    ParticipantUpdated,
    ParticipantDeleted,
    ConferenceUpdated,
    ConnectedPresentation,
    ConnectedScreenshare,
    DisconnectedPresentation,
    StoppedScreenshare,
    Presentation
} from 'src/app/waiting-space/models/video-call-models';

export const onSetupSubjectMock = new Subject<CallSetup>();
export const onConnectedSubjectMock = new Subject<ConnectedCall>();
export const onDisconnectedSubjectMock = new Subject<DisconnectedCall>();
export const onErrorSubjectMock = new Subject<CallError>();
export const onParticipantUpdatedMock = new Subject<ParticipantUpdated>();
export const onParticipantDeleteMock = new Subject<ParticipantDeleted>();
export const onConferenceUpdatedMock = new Subject<ConferenceUpdated>();
export const onCallTransferredMock = new Subject<any>();
export const onScreenshareConnectedMock = new Subject<ConnectedScreenshare>();
export const onScreenshareStoppedMock = new Subject<StoppedScreenshare>();
export const onPresentationConnectedMock = new Subject<ConnectedPresentation>();
export const onPresentationDisconnectedMock = new Subject<DisconnectedPresentation>();
export const onPresentationMock = new Subject<Presentation>();
export const onVideoEvidenceSharedMock = new Subject<void>();
export const onVideoEvidenceStoppedMock = new Subject<void>();
export const onConferenceAdjournedMock = new Subject<void>();
export const pexipCallMock = jasmine.createSpyObj<PexRTCCall>('PexRTCCall', [], ['mutedAudio', 'mutedVideo']);
export const pexipApiMock = jasmine.createSpyObj<PexipClient>('PexipClient', [], { call: pexipCallMock });

export const videoCallServiceSpy = jasmine.createSpyObj<VideoCallService>(
    'VideoCallService',
    [
        'setupClient',
        'makeCall',
        'makeReceiveOnlyCall',
        'disconnectFromCall',
        'connect',
        'onCallSetup',
        'onCallConnected',
        'onCallDisconnected',
        'onConferenceUpdated',
        'onParticipantUpdated',
        'onError',
        'onCallTransferred',
        'toggleMute',
        'toggleVideo',
        'muteParticipant',
        'spotlightParticipant',
        'muteAllParticipants',
        'enableH264',
        'raiseHand',
        'lowerHand',
        'startHearing',
        'pauseHearing',
        'endHearing',
        'leaveHearing',
        'suspendHearing',
        'lowerAllHands',
        'lowerHandById',
        'callParticipantIntoHearing',
        'joinHearingInSession',
        'dismissParticipantFromHearing',
        'renegotiateCall',
        'onScreenshareConnected',
        'onScreenshareStopped',
        'onPresentationConnected',
        'onPresentationDisconnected',
        'onPresentation',
        'startScreenShare',
        'stopScreenShare',
        'retrievePresentation',
        'stopPresentation',
        'selectScreen',
        'retrieveInterpreterRoom',
        'retrieveWitnessInterpreterRoom',
        'retrieveJudicialRoom',
        'onVideoEvidenceShared',
        'onVideoEvidenceStopped',
        'selectScreenWithMicrophone',
        'stopScreenWithMicrophone',
        'onParticipantCreated',
        'onParticipantDeleted',
        'connectWowzaAgent',
        'disconnectWowzaAgent',
        'onConferenceAdjourned',
        'setParticipantOverlayText',
        'transformLayout'
    ],
    {
        pexipAPI: pexipApiMock,
        wowzaAgentName: 'vh-wowza'
    }
);

videoCallServiceSpy.onCallSetup.and.returnValue(onSetupSubjectMock.asObservable());
videoCallServiceSpy.onCallConnected.and.returnValue(onConnectedSubjectMock.asObservable());
videoCallServiceSpy.onCallDisconnected.and.returnValue(onDisconnectedSubjectMock.asObservable());
videoCallServiceSpy.onError.and.returnValue(onErrorSubjectMock.asObservable());
videoCallServiceSpy.onParticipantUpdated.and.returnValue(onParticipantUpdatedMock.asObservable());
videoCallServiceSpy.onConferenceUpdated.and.returnValue(onConferenceUpdatedMock.asObservable());
videoCallServiceSpy.onParticipantCreated.and.returnValue(onParticipantUpdatedMock.asObservable());
videoCallServiceSpy.onParticipantDeleted.and.returnValue(onParticipantDeleteMock.asObservable());
videoCallServiceSpy.onCallTransferred.and.returnValue(onCallTransferredMock.asObservable());
videoCallServiceSpy.onConferenceAdjourned.and.returnValue(onConferenceAdjournedMock.asObservable());
videoCallServiceSpy.onScreenshareConnected.and.returnValue(onScreenshareConnectedMock.asObservable());
videoCallServiceSpy.onScreenshareStopped.and.returnValue(onScreenshareStoppedMock.asObservable());
videoCallServiceSpy.onPresentationConnected.and.returnValue(onPresentationConnectedMock.asObservable());
videoCallServiceSpy.onPresentationDisconnected.and.returnValue(onPresentationDisconnectedMock.asObservable());
videoCallServiceSpy.onPresentation.and.returnValue(onPresentationMock.asObservable());
videoCallServiceSpy.onVideoEvidenceShared.and.returnValue(onVideoEvidenceSharedMock.asObservable());
videoCallServiceSpy.onVideoEvidenceStopped.and.returnValue(onVideoEvidenceStoppedMock.asObservable());
videoCallServiceSpy.transformLayout.and.returnValue(Promise.resolve());
