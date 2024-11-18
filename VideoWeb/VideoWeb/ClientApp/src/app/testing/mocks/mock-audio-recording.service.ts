import { Subject } from 'rxjs';

import { AudioRecordingService } from '../../services/audio-recording.service';
import { VHConference, VHPexipParticipant } from '../../waiting-space/store/models/vh-conference';

const mockConference: VHConference = {
    id: '',
    audioRecordingIngestUrl: '',
    caseName: '',
    caseNumber: '',
    duration: 0,
    endpoints: undefined,
    isVenueScottish: false,
    participants: undefined,
    scheduledDateTime: undefined,
    status: undefined,
    supplier: undefined
};
const mockWowzaAgent: VHPexipParticipant = {
    handRaised: false,
    isAudioOnlyCall: true,
    isRemoteMuted: false,
    isVideoMuted: false,
    isSpotlighted: false,
    isVideoCall: false,
    pexipDisplayName: 'vh-wowza',
    protocol: '',
    role: 'guest',
    receivingAudioMix: '',
    sentAudioMixes: undefined,
    uuid: 'wowzaUUID',
    callTag: 'callTag'
};

const getWowzaAgentConnectionState$ = new Subject<boolean>();
const getAudioRecordingPauseState$ = new Subject<boolean>();

export const audioRecordingServiceSpy = jasmine.createSpyObj<AudioRecordingService>(
    'AudioRecordingService',
    [
        'getWowzaAgentConnectionState',
        'getAudioRecordingPauseState',
        'stopRecording',
        'reconnectToWowza',
        'cleanupDialOutConnections',
        'cleanupSubscriptions'
    ],
    {
        conference: mockConference,
        wowzaAgent: mockWowzaAgent,
        dialOutUUID: [],
        restartActioned: false,
        loggerPrefix: '[AudioRecordingService]'
    }
);

audioRecordingServiceSpy.getWowzaAgentConnectionState.and.returnValue(getWowzaAgentConnectionState$.asObservable());
audioRecordingServiceSpy.getAudioRecordingPauseState.and.returnValue(getAudioRecordingPauseState$.asObservable());
