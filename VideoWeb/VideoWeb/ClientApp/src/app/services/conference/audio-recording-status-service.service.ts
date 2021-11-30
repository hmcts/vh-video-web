import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';
import { BehaviorSubject, Observable } from 'rxjs';
import { ParticipantUpdated } from 'src/app/waiting-space/models/video-call-models';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { ConfigService } from '../api/config.service';
import { ClientSettingsResponse } from '../clients/api-client';
import { LoggerService } from '../logging/logger.service';

@Injectable({
    providedIn: 'root'
})
export class AudioRecordingStatusServiceService {
    private recorderPexipId: Guid | null = null;
    private recorderDisplayName: string;
    private readonly loggerPrefix = '[AudioRecordingStatusServiceService] -';

    private isRecorderInCallSubject = new BehaviorSubject<boolean>(false);

    constructor(private configService: ConfigService, private videoCallService: VideoCallService, private loggerService: LoggerService) {
        this.configService.getClientSettings().subscribe(settings => this.initialise(settings));
    }

    get isRecorderInCall$(): Observable<boolean> {
        return this.isRecorderInCallSubject.asObservable();
    }

    private initialise(settings: ClientSettingsResponse): void {
        this.recorderDisplayName = settings.wowza_recorder_pexip_display_name;
        this.loggerService.info(
            `${this.loggerPrefix} initialising. Expecting recorder participant to have the name: ${this.recorderDisplayName}`
        );

        this.videoCallService.onParticipantCreated().subscribe(participant => this.handleParticipantCreated(participant));
        this.videoCallService.onParticipantDeleted().subscribe(pexipParticipantId => this.handleParticipantDeleted(pexipParticipantId));

        this.isRecorderInCall$.subscribe(isRecorderInCall =>
            this.loggerService.event('RecorderIsInCall', {
                isRecorderInCall: isRecorderInCall
            })
        );
    }

    private handleParticipantCreated(participant: ParticipantUpdated) {
        this.loggerService.debug(`${this.loggerPrefix} pexip participant created: ${participant.pexipDisplayName} (${participant.uuid})`);

        if (participant.pexipDisplayName === this.recorderDisplayName) {
            this.loggerService.info(`${this.loggerPrefix} recorder participant created: ${participant.pexipDisplayName}`);

            this.recorderPexipId = Guid.parse(participant.uuid);

            this.isRecorderInCallSubject.next(true);
        }
    }

    private handleParticipantDeleted(pexipParticipantId: Guid) {
        this.loggerService.debug(`${this.loggerPrefix} pexip participant deleted: ${pexipParticipantId}`);

        if (this.recorderPexipId.equals(pexipParticipantId)) {
            this.loggerService.info(`${this.loggerPrefix} recorder participant deleted: ${pexipParticipantId}`);

            this.recorderPexipId = null;

            this.isRecorderInCallSubject.next(false);
        }
    }
}
