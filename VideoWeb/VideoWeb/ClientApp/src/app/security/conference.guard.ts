import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { VideoWebService } from '../services/api/video-web.service';
import { Logger } from '../services/logging/logger-base';
import { Hearing } from '../shared/models/hearing';
import { pageUrls } from '../shared/page-url.constants';

@Injectable({
    providedIn: 'root'
})
export class ConferenceGuard implements CanActivate {
    constructor(
        private videoWebService: VideoWebService,
        private router: Router,
        private logger: Logger
    ) {}

    async canActivate(next: ActivatedRouteSnapshot): Promise<boolean> {
        const conferenceId = next.paramMap.get('conferenceId');
        this.logger.debug(`[ConferenceGuard] Checking if user can view conference ${conferenceId}`);
        try {
            const data = await this.videoWebService.getConferenceById(conferenceId);
            const hearing = new Hearing(data);
            if (hearing.isPastClosedTime()) {
                this.logger.debug('[ConferenceGuard] Returning back to hearing list because hearing has been closed for over 2 hours.');
                this.router.navigate([pageUrls.JudgeHearingList]);

                return false;
            }
            this.logger.debug(`[ConferenceGuard] User can view conference ${conferenceId}`);
            return true;
        } catch (err) {
            return this.handleError(err);
        }
    }

    private handleError(error) {
        this.logger.error('[ConferenceGuard] Could not get conference data. Returning home.', error);
        this.router.navigate([pageUrls.Home]);

        return false;
    }
}
