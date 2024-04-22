import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { VideoWebService } from '../services/api/video-web.service';
import { Logger } from '../services/logging/logger-base';
import { pageUrls } from '../shared/page-url.constants';
import { Hearing } from '../shared/models/hearing';

@Injectable({
    providedIn: 'root'
})
export class ParticipantWaitingRoomGuard  {
    hearing: Hearing;
    constructor(private videoWebService: VideoWebService, private router: Router, private logger: Logger) {}

    async canActivate(next: ActivatedRouteSnapshot): Promise<boolean> {
        const conferenceId = next.paramMap.get('conferenceId');
        this.logger.debug(`[ParticipantWaitingRoomGuard] - Checking if user can view conference ${conferenceId}`);
        try {
            const data = await this.videoWebService.getConferenceById(conferenceId);
            this.hearing = new Hearing(data);

            if (this.hearing.isPastClosedTime()) {
                this.logger.debug(
                    '[ParticipantWaitingRoomGuard] - Returning back to hearing list because hearing has been closed for over 2 hours.'
                );
                this.router.navigate([pageUrls.ParticipantHearingList]);

                return false;
            }

            return true;
        } catch (err) {
            return this.handleError(err);
        }
    }

    private handleError(error) {
        this.logger.error('[ParticipantWaitingRoomGuard] Could not get conference data. Returning home.', error);
        this.router.navigate([pageUrls.Home]);

        return false;
    }
}
