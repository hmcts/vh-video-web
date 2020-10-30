import { Injectable } from '@angular/core';
import { EventType, UpdateParticipantStatusEventRequest, ApiClient } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';

export const participantPages: string[] = [
    pageUrls.Introduction,
    pageUrls.EquipmentCheck,
    pageUrls.SwitchOnCameraMicrophone,
    pageUrls.ParticipantSelfTestVideo,
    pageUrls.CameraWorking,
    pageUrls.MicrophoneWorking,
    pageUrls.VideoWorking,
    pageUrls.HearingRules,
    pageUrls.Declaration
];

@Injectable({
    providedIn: 'root'
})
export class ParticipantStatusUpdateService {
    constructor(private apiClient: ApiClient, private logger: Logger, private router: Router) {}
    async postParticipantStatus(eventType: EventType, conferenceId: string = null) {
        try {
            const forEventConferenceId = conferenceId || this.checkRouter();
            if (forEventConferenceId) {
                this.logger.debug(`[ParticipantStatusUpdateService] - Updating participant status`, {
                    conferenceId: forEventConferenceId,
                    eventType
                });
                await this.apiClient
                    .updateParticipantStatus(
                        forEventConferenceId,
                        new UpdateParticipantStatusEventRequest({
                            event_type: eventType
                        })
                    )
                    .toPromise();
            }
        } catch (error) {
            this.logger.error('[ParticipantStatusUpdateService] - Failed to raise "UpdateParticipantStatusEventRequest"', error, {
                conferenceId
            });
        }
    }

    checkRouter(): string {
        const urlCurrent = this.router.url;
        const params = urlCurrent.split('/');

        return params.length > 2 && participantPages.findIndex(x => x === params[1]) > -1 ? params[2] : null;
    }
}
