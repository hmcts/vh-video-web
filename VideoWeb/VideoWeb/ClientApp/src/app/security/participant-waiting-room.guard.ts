import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { VideoWebService } from '../services/api/video-web.service';
import { ConferenceStatus } from '../services/clients/api-client';
import { Logger } from '../services/logging/logger-base';
import { PageUrls } from '../shared/page-url.constants';

@Injectable({
  providedIn: 'root'
})
export class ParticipantWaitingRoomGuard implements CanActivate {
  constructor(private videoWebService: VideoWebService, private router: Router, private logger: Logger) { }

  async canActivate(next: ActivatedRouteSnapshot): Promise<boolean> {
    try {
      const conferenceId = next.paramMap.get('conferenceId');

      const data = await this.videoWebService.getConferenceById(conferenceId);

      if (data.status === ConferenceStatus.Closed) {
        this.logger.info('Conference Guard - Returning back to hearing list because status closed over 30 minutes.');
        this.router.navigate([PageUrls.ParticipantHearingList]);

        return false;
      }

      return true;
    } catch (err) {
      return this.handleError(err);
    }
  }

  private handleError(error) {
    this.logger.error(`Could not get conference data.`, error);
    this.router.navigate([PageUrls.Home]);

    return false;
  }
}
