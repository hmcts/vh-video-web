import { Injectable } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';
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
    private currentParticipant: ParticipantModel;
    private currentConference: ConferenceResponse;

    constructor(
        private apiClient: ApiClient,
        private participantService: ParticipantService,
        private conferenceService: ConferenceService,
        private deviceTypeService: DeviceTypeService,
        private heartbeatMapper: HeartbeatModelMapper,
        private eventService: EventsService,
        private logger: Logger
    ) {}

    private getCurrentConferenceAndParticipant(): Observable<{ conference: ConferenceResponse; participant: ParticipantModel }> {
        return combineLatest([this.conferenceService.currentConference$, this.participantService.loggedInParticipant$]).pipe(
            map(value => {
                return { conference: value[0], participant: value[1] };
            }),
            tap(details => {
                this.logger.info(`${this.loggerPrefix} got current conference and participant details`, {
                    conferenceId: details.conference?.id ?? null,
                    participantId: details.participant?.id ?? null
                });
            }),
            filter(details => !!details.conference && !!details.participant),
            take(1)
        );
    }

    initialiseHeartbeat(pexipApi: PexipClient) {
        this.getCurrentConferenceAndParticipant().subscribe(details => {
            this.currentConference = details.conference;
            this.currentParticipant = details.participant;

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
        });
    }

    async handleHeartbeat(heartbeat: any) {
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
