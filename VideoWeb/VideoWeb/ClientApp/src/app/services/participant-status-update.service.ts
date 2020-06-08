import { Injectable } from '@angular/core';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { EventType, UpdateParticipantStatusEventRequest } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { Router } from '@angular/router';
import { pageUrls } from 'src/app/shared/page-url.constants';

export const ParticipantPages: string[] = [
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

    constructor(private videoWebService: VideoWebService, private logger: Logger, private router: Router) {}
    async postParticipantStatus() {
        try {
            const urlCurrent = await this.router.url;
            const params = urlCurrent.split('/')
            if (params.length > 2 && this.checkRouter(params[1])) {
                await this.videoWebService.raiseParticipantEvent(
                    params[2],
                    new UpdateParticipantStatusEventRequest({
                        event_type: EventType.ParticipantNotSignedIn
                    })
                );
            }
        } catch (error) {
            this.logger.error('Failed to raise "UpdateParticipantStatusEventRequest"', error);
        }
    }

    private checkRouter(currentUrl: string): boolean {
         return ParticipantPages.findIndex(x => x === currentUrl) > -1
    }
}
