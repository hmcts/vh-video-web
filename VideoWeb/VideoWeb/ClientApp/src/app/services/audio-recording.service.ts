import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { VideoCallService } from '../waiting-space/services/video-call.service';
import { EventsService } from './events.service';
import { Logger } from './logging/logger-base';
import { AudioRecordingPauseStateMessage } from '../shared/models/audio-recording-pause-state-message';
import { Store } from '@ngrx/store';
import { ConferenceState } from '../waiting-space/store/reducers/conference.reducer';
import * as ConferenceSelectors from '../waiting-space/store/selectors/conference.selectors';
import { VHConference, VHPexipParticipant } from '../waiting-space/store/models/vh-conference';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AudioRecordingService {
    loggerPrefix = '[AudioRecordingService]';
    dialOutUUID = [];
    restartActioned: boolean;
    conference: VHConference;
    wowzaAgent: VHPexipParticipant;

    private readonly audioStopped$: Subject<boolean> = new Subject<boolean>();
    private readonly wowzaAgentConnection$ = new Subject<boolean>();
    private readonly onDestroy$ = new Subject<void>();

    constructor(
        private readonly logger: Logger,
        private readonly videoCallService: VideoCallService,
        private readonly eventService: EventsService,
        conferenceStore: Store<ConferenceState>
    ) {
        conferenceStore
            .select(ConferenceSelectors.getActiveConference)
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(conference => {
                this.conference = conference;
            });

        conferenceStore
            .select(ConferenceSelectors.getWowzaParticipant)
            .pipe(
                takeUntil(this.onDestroy$),
                distinctUntilChanged((prev, curr) => prev?.uuid === curr?.uuid)
            )
            .subscribe(participant => {
                if (participant) {
                    this.dialOutUUID = [...new Set([...this.dialOutUUID, participant?.uuid])];
                }
                this.wowzaAgent = participant;
                if (participant?.isAudioOnlyCall) {
                    this.wowzaAgentConnection$.next(true);
                    this.restartActioned = false;
                } else {
                    this.wowzaAgentConnection$.next(false);
                }
            });

        this.eventService.getAudioPaused().subscribe(async (message: AudioRecordingPauseStateMessage) => {
            if (this.conference.id === message.conferenceId) {
                this.audioStopped$.next(message.pauseState);
            }
        });
    }

    getWowzaAgentConnectionState(): Observable<boolean> {
        return this.wowzaAgentConnection$.asObservable();
    }

    getAudioRecordingPauseState(): Observable<boolean> {
        return this.audioStopped$.asObservable();
    }

    async stopRecording() {
        await this.eventService.sendAudioRecordingPaused(this.conference.id, true);
        this.videoCallService.disconnectWowzaAgent(this.wowzaAgent.uuid);
        this.dialOutUUID = this.dialOutUUID.filter(uuid => uuid !== this.wowzaAgent.uuid);
    }

    async reconnectToWowza(failedToConnectCallback: Function) {
        this.restartActioned = true;
        this.cleanupDialOutConnections();
        this.videoCallService.connectWowzaAgent(this.conference.audioRecordingIngestUrl, async dialOutToWowzaResponse => {
            if (dialOutToWowzaResponse.status === 'success') {
                await this.eventService.sendAudioRecordingPaused(this.conference.id, false);
            } else {
                failedToConnectCallback();
            }
        });
    }

    cleanupDialOutConnections() {
        this.logger.debug(`${this.loggerPrefix} Cleaning up dial out connections, if any {dialOutUUID: ${this.dialOutUUID}}`);
        this.dialOutUUID?.forEach(uuid => {
            this.videoCallService.disconnectWowzaAgent(uuid);
        });
        this.dialOutUUID = [];
    }

    cleanupSubscriptions() {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }
}