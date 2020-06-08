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

    constructor(private apiClient: ApiClient, private logger: Logger, private router: Router) { }
    async postParticipantStatus(eventType: EventType) {
        try {
            const conferenceId = this.checkRouter();
            if (conferenceId) {
                await this.apiClient.updateParticipantStatus(
                    conferenceId,
                    new UpdateParticipantStatusEventRequest({
                        event_type: eventType
                    })).toPromise();
            }
        } catch (error) {
            this.logger.error('Failed to raise "UpdateParticipantStatusEventRequest"', error);
        }
    }

    checkRouter(): string {
        const urlCurrent = this.router.url;
        const params = urlCurrent.split('/');

        return params.length > 2 && participantPages.findIndex(x => x === params[1]) > -1 ? params[2] : null;
    }
}
