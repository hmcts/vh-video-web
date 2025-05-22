import { AudioRecordingService } from './audio-recording.service';
import { VideoCallService } from '../waiting-space/services/video-call.service';
import { EventsService } from './events.service';
import { Subject } from 'rxjs';
import { AudioRecordingPauseStateMessage } from '../shared/models/audio-recording-pause-state-message';
import { VHPexipParticipant } from '../waiting-space/store/models/vh-conference';
import * as ConferenceSelectors from '../waiting-space/store/selectors/conference.selectors';
import { initAllWRDependencies, mockConferenceStore } from '../waiting-space/waiting-room-shared/tests/waiting-room-base-setup';

describe('AudioRecordingService', () => {
    let service: AudioRecordingService;
    let videoCallServiceSpy: jasmine.SpyObj<VideoCallService>;
    let eventServiceSpy: jasmine.SpyObj<EventsService>;
    const audioStoppedMock$ = new Subject<AudioRecordingPauseStateMessage>();
    const pexipParticipant: VHPexipParticipant = {
        isRemoteMuted: false,
        isSpotlighted: false,
        handRaised: false,
        isVideoMuted: false,
        pexipDisplayName: 'vh-wowza',
        uuid: 'unique-identifier',
        callTag: 'call-tag',
        isAudioOnlyCall: true,
        isVideoCall: false,
        role: 'guest',
        protocol: 'protocol-type',
        receivingAudioMix: 'audio-mix',
        sentAudioMixes: []
    };

    beforeEach(() => {
        mockConferenceStore.overrideSelector(ConferenceSelectors.getWowzaParticipant, pexipParticipant);
        videoCallServiceSpy = jasmine.createSpyObj('VideoCallService', [
            'disconnectWowzaAgent',
            'connectWowzaAgent',
            'getWowzaAgentConnectionState'
        ]);
        eventServiceSpy = jasmine.createSpyObj('EventsService', ['sendAudioRecordingPaused', 'getAudioPaused']);
        eventServiceSpy.getAudioPaused.and.returnValue(audioStoppedMock$);

        const loggerMock = jasmine.createSpyObj('Logger', ['debug']);

        service = new AudioRecordingService(loggerMock, videoCallServiceSpy, eventServiceSpy, mockConferenceStore);
    });

    afterEach(() => {
        service.cleanupSubscriptions();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('stopRecording', () => {
        it('should stop recording', async () => {
            service.conference = { id: 'conferenceId' } as any;
            service.wowzaAgent = { uuid: 'wowzaUUID' } as any;
            await service.stopRecording();
            expect(eventServiceSpy.sendAudioRecordingPaused).toHaveBeenCalledWith('conferenceId', true);
            expect(videoCallServiceSpy.disconnectWowzaAgent).toHaveBeenCalledWith('wowzaUUID');
        });
    });

    describe('cleanupSubscriptions', () => {
        it('should clean up subscriptions on destroy', () => {
            const onDestroySpy = spyOn(service['onDestroy$'], 'next');
            const onDestroyCompleteSpy = spyOn(service['onDestroy$'], 'complete');
            service.cleanupSubscriptions();
            expect(onDestroySpy).toHaveBeenCalled();
            expect(onDestroyCompleteSpy).toHaveBeenCalled();
        });
    });

    afterAll(() => {
        mockConferenceStore.resetSelectors();
    });

    beforeAll(() => {
        initAllWRDependencies();
    });
});
