import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { VideoCallService } from '../waiting-space/services/video-call.service';
import { EventsService } from './events.service';
import { Logger } from './logging/logger-base';
import { Store } from '@ngrx/store';
import { ConferenceState } from '../waiting-space/store/reducers/conference.reducer';
import * as ConferenceSelectors from '../waiting-space/store/selectors/conference.selectors';
import { VHConference, VHPexipParticipant } from '../waiting-space/store/models/vh-conference';
import { distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';
import { AudioRecordingActions } from '../waiting-space/store/actions/audio-recording.actions';

@Injectable({
    providedIn: 'root'
})
export class AudioRecordingService {
    loggerPrefix = '[AudioRecordingService]';
    dialOutUUID = [];
    conference: VHConference;
    wowzaAgent: VHPexipParticipant;

    private readonly onDestroy$ = new Subject<void>();

    constructor(
        private readonly logger: Logger,
        private readonly videoCallService: VideoCallService,
        private readonly eventService: EventsService,
        private readonly conferenceStore: Store<ConferenceState>
    ) {
        this.conferenceStore
            .select(ConferenceSelectors.getActiveConference)
            .pipe(
                filter(conference => !!conference),
                takeUntil(this.onDestroy$)
            )
            .subscribe(conference => {
                this.conference = conference;
            });
        this.conferenceStore
            .select(ConferenceSelectors.getWowzaParticipant)
            .pipe(
                takeUntil(this.onDestroy$),
                distinctUntilChanged((prev, curr) => prev?.uuid === curr?.uuid)
            )
            .subscribe(wowzaParticipant => this.handleWowzaParticipantAdded(wowzaParticipant));
    }

    async stopRecording() {
        await this.eventService.sendAudioRecordingPaused(this.conference.id, true);
        this.videoCallService.disconnectWowzaAgent(this.wowzaAgent.uuid);
        this.dialOutUUID = this.dialOutUUID.filter(uuid => uuid !== this.wowzaAgent.uuid);
    }

    reconnectToWowza() {
        this.logger.debug(`${this.loggerPrefix} Reconnecting to Wowza agent`);
        this.videoCallService.connectWowzaAgent(this.conference.audioRecordingIngestUrl, async dialOutToWowzaResponse => {
            if (dialOutToWowzaResponse.status === 'success') {
                this.logger.debug(`${this.loggerPrefix} dial-out request successful`);
                this.eventService.sendAudioRecordingPaused(this.conference.id, false);
            } else {
                this.logger.error(`${this.loggerPrefix} dial-out request failed`, new Error('Dial-out request failed'));
                this.conferenceStore.dispatch(
                    AudioRecordingActions.resumeAudioRecordingFailure({
                        conferenceId: this.conference.id
                    })
                );
            }
        });
    }

    cleanupDialOutConnections(): void {
        this.logger.debug(`${this.loggerPrefix} Cleaning up dial out connections, if any {dialOutUUID: ${this.dialOutUUID}}`);

        if (this.dialOutUUID.length > 0) {
            this.dialOutUUID?.forEach(uuid => {
                if (uuid) {
                    this.videoCallService.disconnectWowzaAgent(uuid);
                }
            });
        }

        this.dialOutUUID = [];
    }

    cleanupSubscriptions(): void {
        this.onDestroy$.next();
        this.onDestroy$.complete();
    }

    private async handleWowzaParticipantAdded(participant: VHPexipParticipant) {
        if (participant) {
            this.dialOutUUID = [...new Set([...this.dialOutUUID, participant?.uuid])];
            this.logger.debug(`${this.loggerPrefix} Wowza agent added {uuid: ${participant.uuid}}`, { currentList: this.dialOutUUID });
        }
        this.wowzaAgent = participant;
    }
}
