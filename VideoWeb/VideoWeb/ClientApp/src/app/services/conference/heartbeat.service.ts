import { Injectable } from '@angular/core';
import { combineLatest } from 'rxjs';
import { filter, take, tap } from 'rxjs/operators';
import { HeartbeatModelMapper } from 'src/app/shared/mappers/heartbeat-model-mapper';
import { ApiClient } from '../clients/api-client';
import { DeviceTypeService } from '../device-type.service';
import { EventsService } from '../events.service';
import { Logger } from '../logging/logger-base';
import { environment } from 'src/environments/environment';
import { ConferenceState } from 'src/app/waiting-space/store/reducers/conference.reducer';
import * as ConferenceSelectors from '../../waiting-space/store/selectors/conference.selectors';
import { Store } from '@ngrx/store';
import { VHConference, VHParticipant } from 'src/app/waiting-space/store/models/vh-conference';

@Injectable({
    providedIn: 'root'
})
export class HeartbeatService {
    heartbeat: HeartbeatClient;
    initialising = false;

    private loggerPrefix = '[VodafoneHeartbeatService] -';
    private currentParticipant: VHParticipant;
    private currentConference: VHConference;

    constructor(
        private apiClient: ApiClient,
        private conferenceStore: Store<ConferenceState>,
        private deviceTypeService: DeviceTypeService,
        private heartbeatMapper: HeartbeatModelMapper,
        private eventService: EventsService,
        private logger: Logger
    ) {}

    initialiseHeartbeat(pexipApi: PexipClient) {
        combineLatest([
            this.conferenceStore.select(ConferenceSelectors.getActiveConference),
            this.conferenceStore.select(ConferenceSelectors.getLoggedInParticipant)
        ])
            .pipe(
                tap(([conference, participant]) => {
                    this.logger.info(`${this.loggerPrefix} got current conference and participant details`, {
                        conferenceId: conference?.id ?? null,
                        participantId: participant?.id ?? null
                    });
                }),
                filter(([conference, participant]) => !!conference && !!participant),
                take(1)
            )
            .subscribe(([conference, participant]) => {
                this.currentConference = conference;
                this.currentParticipant = participant;

                if (this.heartbeat || this.initialising) {
                    return;
                }
                this.initialising = true;
                this.apiClient.getHeartbeatConfigForParticipant(this.currentConference.id, this.currentParticipant.id).subscribe({
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
                        this.heartbeat.logHeartbeat = environment.logHeartbeat;
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
            this.deviceTypeService.getOSVersion(),
            this.deviceTypeService.getDevice()
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
        this.initialising = false;
        this.logger.info(`${this.loggerPrefix} Should have stopped heartbeat`);
    }
}
