import { AudioRecordingService } from './audio-recording.service';
import { VideoCallService } from '../waiting-space/services/video-call.service';
import { EventsService } from './events.service';
import { Subject } from 'rxjs';
import { AudioRecordingPauseStateMessage } from '../shared/models/audio-recording-pause-state-message';
import { VHPexipParticipant } from '../waiting-space/store/models/vh-conference';
import * as ConferenceSelectors from '../waiting-space/store/selectors/conference.selectors';
import {
    globalConference,
    initAllWRDependencies,
    mockConferenceStore
} from '../waiting-space/waiting-room-shared/tests/waiting-room-base-setup';

describe('AudioRecordingService', () => {
    let service: AudioRecordingService;
    let videoCallServiceSpy: jasmine.SpyObj<VideoCallService>;
    let eventServiceSpy: jasmine.SpyObj<EventsService>;
    const audioStoppedMock$ = new Subject<AudioRecordingPauseStateMessage>();
    const pexipParticipant: VHPexipParticipant = {
        isRemoteMuted: false,
        isSpotlighted: false,
        handRaised: false,
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

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should get audio pause state', done => {
        service.getAudioRecordingPauseState().subscribe(isPaused => {
            expect(isPaused).toBeTrue();
            done();
        });
        audioStoppedMock$.next({ conferenceId: globalConference.id, pauseState: true });
    });

    it('should get Wowza agent connection state', done => {
        const participant: VHPexipParticipant = { uuid: 'wowzaUUID', isAudioOnlyCall: false } as VHPexipParticipant;
        mockConferenceStore.overrideSelector(ConferenceSelectors.getWowzaParticipant, participant);

        service.getWowzaAgentConnectionState().subscribe(isConnected => {
            expect(isConnected).toBeFalse();
            done();
        });

        mockConferenceStore.refreshState();
    });

    describe('functions', () => {
        it('should stop recording', async () => {
            service.conference = { id: 'conferenceId' } as any;
            service.wowzaAgent = { uuid: 'wowzaUUID' } as any;
            await service.stopRecording();
            expect(eventServiceSpy.sendAudioRecordingPaused).toHaveBeenCalledWith('conferenceId', true);
            expect(videoCallServiceSpy.disconnectWowzaAgent).toHaveBeenCalledWith('wowzaUUID');
        });

        describe('reconnectToWowza', () => {
            it('should reconnect to Wowza', async () => {
                const failedToConnectCallback = jasmine.createSpy('failedToConnectCallback');
                service.conference = { id: globalConference.id, audioRecordingIngestUrl: 'ingestUrl' } as any;
                videoCallServiceSpy.connectWowzaAgent.and.callFake((url, callback) => {
                    callback({ status: 'success', result: ['newUUID'] });
                });

                await service.reconnectToWowza(failedToConnectCallback);
                expect(service.restartActioned).toBeTrue();
                expect(videoCallServiceSpy.connectWowzaAgent).toHaveBeenCalledWith('ingestUrl', jasmine.any(Function));
                expect(eventServiceSpy.sendAudioRecordingPaused).toHaveBeenCalledWith(globalConference.id, false);
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

            it('should call push false to wowzaAgentConnection$ if reconnect to Wowza fails', async () => {
                service.conference = { id: 'conferenceId', audioRecordingIngestUrl: 'ingestUrl' } as any;
                videoCallServiceSpy.connectWowzaAgent.and.callFake((url, callback) => {
                    callback({ status: 'failure' });
                });

                let emittedValue: boolean | undefined;
                service.getWowzaAgentConnectionState().subscribe(value => (emittedValue = value));

                await service.reconnectToWowza();

                // Assert that `false` was emitted by the observable
                expect(emittedValue).toBe(false);
            });

            it('should clean up dial out connections', () => {
                service.dialOutUUID = ['uuid1', 'uuid2'];
                service.cleanupDialOutConnections();
                expect(videoCallServiceSpy.disconnectWowzaAgent).toHaveBeenCalledWith('uuid1');
                expect(videoCallServiceSpy.disconnectWowzaAgent).toHaveBeenCalledWith('uuid2');
                expect(service.dialOutUUID.length).toBe(0);
            });
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
