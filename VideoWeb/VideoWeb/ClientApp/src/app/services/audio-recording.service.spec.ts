import { AudioRecordingService } from './audio-recording.service';
import { VideoCallService } from '../waiting-space/services/video-call.service';
import { EventsService } from './events.service';
import { Subject } from 'rxjs';
import { AudioRecordingPauseStateMessage } from '../shared/models/audio-recording-pause-state-message';
import { VHPexipParticipant } from '../waiting-space/store/models/vh-conference';
import * as ConferenceSelectors from '../waiting-space/store/selectors/conference.selectors';
import { initAllWRDependencies, mockConferenceStore } from '../waiting-space/waiting-room-shared/tests/waiting-room-base-setup';
import { AudioRecordingActions } from '../waiting-space/store/actions/audio-recording.actions';
import { fakeAsync, flush } from '@angular/core/testing';

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

        const loggerMock = jasmine.createSpyObj('Logger', ['debug', 'error']);

        service = new AudioRecordingService(loggerMock, videoCallServiceSpy, eventServiceSpy, mockConferenceStore);
    });

    afterEach(() => {
        service.cleanupSubscriptions();
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

    describe('reconnectToWowza', () => {
        it('should reconnect to Wowza agent', () => {
            service.conference = { audioRecordingIngestUrl: 'ingestUrl', id: 'conferenceId' } as any;
            service.wowzaAgent = { uuid: 'wowzaUUID' } as any;
            const dialOutToWowzaResponse = { status: 'success' };
            videoCallServiceSpy.connectWowzaAgent.and.callFake((_, callback) => {
                callback(dialOutToWowzaResponse);
            });
            service.reconnectToWowza();
            expect(videoCallServiceSpy.connectWowzaAgent).toHaveBeenCalledWith('ingestUrl', jasmine.any(Function));
        });

        it('should handle failed reconnection to Wowza agent', fakeAsync(() => {
            spyOn(mockConferenceStore, 'dispatch');

            service.conference = { audioRecordingIngestUrl: 'ingestUrl', id: 'conferenceId' } as any;
            service.wowzaAgent = { uuid: 'wowzaUUID' } as any;
            const dialOutToWowzaResponse = { status: 'failure' };
            videoCallServiceSpy.connectWowzaAgent.and.callFake((_, callback) => {
                callback(dialOutToWowzaResponse);
            });
            service.reconnectToWowza();
            flush();
            expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(
                AudioRecordingActions.resumeAudioRecordingFailure({
                    conferenceId: 'conferenceId'
                })
            );
        }));
    });

    describe('cleanupDialOutConnections', () => {
        it('should clean up dial out connections', () => {
            service.dialOutUUID = ['uuid1', 'uuid2'];
            service.cleanupDialOutConnections();
            expect(videoCallServiceSpy.disconnectWowzaAgent).toHaveBeenCalledWith('uuid1');
            expect(videoCallServiceSpy.disconnectWowzaAgent).toHaveBeenCalledWith('uuid2');
            expect(service.dialOutUUID).toEqual([]);
        });
    });

    afterAll(() => {
        mockConferenceStore.resetSelectors();
    });

    beforeAll(() => {
        initAllWRDependencies();
    });
});
