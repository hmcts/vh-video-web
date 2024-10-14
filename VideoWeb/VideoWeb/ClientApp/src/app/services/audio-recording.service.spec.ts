import { AudioRecordingService } from './audio-recording.service';
import { VideoCallService } from '../waiting-space/services/video-call.service';
import { EventsService } from './events.service';
import { Subject } from 'rxjs';
import { AudioRecordingPauseStateMessage } from '../shared/models/audio-recording-pause-state-message';
import { initAllWRDependencies, mockConferenceStore } from '../waiting-space/waiting-room-shared/tests/waiting-room-base-setup';
import { VHConference, VHPexipParticipant } from '../waiting-space/store/models/vh-conference';

describe('AudioRecordingService', () => {
    let service: AudioRecordingService;
    let videoCallServiceSpy: jasmine.SpyObj<VideoCallService>;
    let eventServiceSpy: jasmine.SpyObj<EventsService>;

    beforeEach(() => {
        videoCallServiceSpy = jasmine.createSpyObj('VideoCallService', [
            'disconnectWowzaAgent',
            'connectWowzaAgent',
            'getWowzaAgentConnectionState'
        ]);
        eventServiceSpy = jasmine.createSpyObj('EventsService', ['sendAudioRecordingPaused', 'getAudioPaused']);
        eventServiceSpy.getAudioPaused.and.returnValue(new Subject<AudioRecordingPauseStateMessage>());

        const loggerMock = jasmine.createSpyObj('Logger', ['debug']);

        service = new AudioRecordingService(loggerMock, videoCallServiceSpy, eventServiceSpy, mockConferenceStore);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('functions', () => {
        beforeEach(() => {
            service.wowzaAgent = { uuid: 'wowzaUUID' } as VHPexipParticipant;
            service.conference = { id: 'conferenceId' } as VHConference;
        });

        it('should stop recording', async () => {
            service.conference = { id: 'conferenceId' } as any;
            service.wowzaAgent = { uuid: 'wowzaUUID' } as any;
            await service.stopRecording();
            expect(eventServiceSpy.sendAudioRecordingPaused).toHaveBeenCalledWith('conferenceId', true);
            expect(videoCallServiceSpy.disconnectWowzaAgent).toHaveBeenCalledWith('wowzaUUID');
        });

        it('should reconnect to Wowza', async () => {
            const failedToConnectCallback = jasmine.createSpy('failedToConnectCallback');
            service.conference = { id: 'conferenceId', audioRecordingIngestUrl: 'ingestUrl' } as any;
            videoCallServiceSpy.connectWowzaAgent.and.callFake((url, callback) => {
                callback({ status: 'success', result: ['newUUID'] });
            });

            await service.reconnectToWowza(failedToConnectCallback);
            expect(service.restartActioned).toBeTrue();
            expect(videoCallServiceSpy.connectWowzaAgent).toHaveBeenCalledWith('ingestUrl', jasmine.any(Function));
            expect(eventServiceSpy.sendAudioRecordingPaused).toHaveBeenCalledWith('conferenceId', false);
            expect(failedToConnectCallback).not.toHaveBeenCalled();
        });

        it('should call failedToConnectCallback if reconnect to Wowza fails', async () => {
            const failedToConnectCallback = jasmine.createSpy('failedToConnectCallback');
            service.conference = { id: 'conferenceId', audioRecordingIngestUrl: 'ingestUrl' } as any;
            videoCallServiceSpy.connectWowzaAgent.and.callFake((url, callback) => {
                callback({ status: 'failure' });
            });

            await service.reconnectToWowza(failedToConnectCallback);
            expect(failedToConnectCallback).toHaveBeenCalled();
        });

        it('should clean up dial out connections', () => {
            service.dialOutUUID = ['uuid1', 'uuid2'];
            service.cleanupDialOutConnections();
            expect(videoCallServiceSpy.disconnectWowzaAgent).toHaveBeenCalledWith('uuid1');
            expect(videoCallServiceSpy.disconnectWowzaAgent).toHaveBeenCalledWith('uuid2');
            expect(service.dialOutUUID.length).toBe(0);
        });

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
