import {Injectable} from '@angular/core';
import {Observable, Subject} from "rxjs";
import {ParticipantUpdated} from "../waiting-space/models/video-call-models";
import {ConferenceResponse} from "./clients/api-client";
import {VideoCallService} from "../waiting-space/services/video-call.service";
import {EventsService} from "./events.service";
import {Logger} from "./logging/logger-base";

@Injectable({
  providedIn: 'root'
})
export class AudioRecordingService {

    audioStopped$: Subject<boolean> = new Subject<boolean>();
    loggerPrefix = '[AudioRecordingService]';
    dialOutUUID = [];
    wowzaAgent: ParticipantUpdated;
    restartActioned: boolean;
    private conference: ConferenceResponse
    private participantId: string

    /// <summary>
    /// Return true if the audio recording has been stopped
    /// </summary>
    getAudioRecordingState() : Observable<boolean> {
        return this.audioStopped$.asObservable();
    }
    constructor(private logger: Logger, private videoCallService: VideoCallService, private eventService: EventsService) { }

    init(conference: ConferenceResponse, participantId: string): void {
        this.conference = conference;
        this.participantId = participantId;
        this.eventService.getAudioRestartActioned().subscribe(async (conferenceId: string) => {
            if (this.conference.id === conferenceId) {
                this.audioStopped$.next(false);
            }
        });
        this.eventService.getAudioPausedActioned().subscribe(async (conferenceId: string) => {
            if (this.conference.id === conferenceId) {
                this.audioStopped$.next(true);
            }
        });

    }

    async stopRecording() {
      this.audioStopped$.next(true);
      await this.eventService.sendAudioRecordingPause(this.conference.id, this.participantId, true);
      this.videoCallService.disconnectWowzaAgent(this.conference.id);
    }

    async reconnectToWowza(failedToConnectCallback: Function) {
        this.restartActioned = true;
        this.cleanupDialOutConnections();
        this.videoCallService.connectWowzaAgent(this.conference.ingest_url, async dialOutToWowzaResponse => {
            if (dialOutToWowzaResponse.status === 'success') {
                this.dialOutUUID.push(dialOutToWowzaResponse.result[0]);
                await this.eventService.sendAudioRestartActioned(this.conference.id, this.participantId);
                this.audioStopped$.next(false);
            } else {
                failedToConnectCallback();
            }
        });
    }

    updateWowzaParticipant(updatedParticipant: ParticipantUpdated) {
        if (updatedParticipant.uuid === this.wowzaAgent?.uuid) {
            this.wowzaAgent = updatedParticipant;
            this.logger.debug(`${this.loggerPrefix} WowzaListener updated`, {
                pexipId: updatedParticipant.uuid,
                displayName: updatedParticipant.pexipDisplayName
            });
        }
    }

    cleanupDialOutConnections() {
        this.logger.debug(`${this.loggerPrefix} Cleaning up dial out connections, if any {dialOutUUID: ${this.dialOutUUID}}`);
        this.dialOutUUID?.forEach(uuid => {
            this.videoCallService.disconnectWowzaAgent(uuid);
        });
        this.dialOutUUID = [];
    }

}
