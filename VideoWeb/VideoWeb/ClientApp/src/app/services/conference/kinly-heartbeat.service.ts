import { Injectable } from '@angular/core';
import { HeartbeatModelMapper } from 'src/app/shared/mappers/heartbeat-model-mapper';
import { ParticipantModel } from 'src/app/shared/models/participant';
import { ApiClient, ConferenceResponse } from '../clients/api-client';
import { DeviceTypeService } from '../device-type.service';
import { EventsService } from '../events.service';
import { Logger } from '../logging/logger-base';
import { ConferenceService } from './conference.service';
import { ParticipantService } from './participant.service';

declare var HeartbeatFactory: any;

@Injectable({
    providedIn: 'root'
})
export class KinlyHeartbeatService {
    private loggerPrefix = '[KinlyHeartbeatService] -';
    heartbeat: any; // NO TS defined
    private currentConference: ConferenceResponse;
    private currentParticipant: ParticipantModel;

    constructor(
        private apiClient: ApiClient,
        private participantService: ParticipantService,
        private conferenceService: ConferenceService,
        private deviceTypeService: DeviceTypeService,
        private heartbeatMapper: HeartbeatModelMapper,
        private eventService: EventsService,
        private logger: Logger
    ) {
        this.conferenceService.currentConference$.subscribe(conference => {
            this.logger.debug(`${this.loggerPrefix} conference changed`, {
                old: this.currentConference?.id ?? null,
                new: conference?.id ?? null
            });
            this.currentConference = conference;
        });

        this.participantService.loggedInParticipant$.subscribe(loggedInParticipant => {
            this.logger.debug(`${this.loggerPrefix} participant changed`, {
                old: this.currentParticipant?.id ?? null,
                new: loggedInParticipant?.id ?? null
            });
            this.currentParticipant = loggedInParticipant;
        });
    }

    initialiseHeartbeat(pexipApi: PexipClient) {
        if (!this.currentConference) {
            this.logger.warn(`${this.loggerPrefix} conference is falsy. Cannot initialise heartbeat`);
            return;
        }

        if (!this.currentParticipant) {
            this.logger.warn(`${this.loggerPrefix} logged in participant is falsy. Cannot initialise heartbeat`);
            return;
        }

        this.apiClient.getHeartbeatConfigForParticipant(this.currentParticipant.id).subscribe({
            next: heartbeatConfiguration => {
                this.logger.info(`${this.loggerPrefix} got heartbeat configuration`, {
                    heartbeatBaseUrl: heartbeatConfiguration.heartbeat_url_base,
                    heartbeatToken: heartbeatConfiguration.heartbeat_jwt
                });

                this.heartbeat = new HeartbeatFactory(
                    pexipApi,
                    `${heartbeatConfiguration.heartbeat_url_base}/${this.currentConference.id}`,
                    this.currentConference.id,
                    this.currentParticipant.id,
                    `Bearer ${heartbeatConfiguration.heartbeat_jwt}`,
                    this.handleHeartbeat.bind(this)
                );
            },
            error: error => {
                this.logger.error(`${this.loggerPrefix} failed to get heartbeat config`, error, {
                    conference: this.currentConference,
                    participant: this.currentParticipant
                });
            }
        });
    }

    async handleHeartbeat(heartbeat: any) {
        if (!this.currentConference || !this.currentParticipant) {
            this.logger.warn(`${this.loggerPrefix} current conference or participant is falsey. Stopping heartbeat.`, {
                conference: this.currentConference,
                participant: this.currentParticipant
            });

            this.stopHeartbeat();
            return;
        }

        const heartbeatModel = this.heartbeatMapper.map(
            JSON.parse(heartbeat),
            this.deviceTypeService.getBrowserName(),
            this.deviceTypeService.getBrowserVersion(),
            this.deviceTypeService.getOSName(),
            this.deviceTypeService.getOSVersion()
        );

        await this.eventService.sendHeartbeat(this.currentConference.id, this.currentParticipant.id, heartbeatModel);
    }

    stopHeartbeat() {
        this.logger.debug(`${this.loggerPrefix} Attempting to stop heartbeat`);
        if (!this.heartbeat) {
            this.logger.warn(`${this.loggerPrefix} Couldn't stop the heartbeat as it didn't exist`);
            return;
        }

        this.heartbeat.kill();
        this.heartbeat = null;
        this.logger.info(`${this.loggerPrefix} Should of stopped heartbeat`);
    }
}
