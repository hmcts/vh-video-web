import { Injectable } from '@angular/core';
import {ActivatedRoute, ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import { Logger } from '../services/logging/logger-base';
import {VideoWebService} from '../services/api/video-web.service';
import {ConferenceResponse, ConferenceStatus} from '../services/clients/api-client';
import {PageUrls} from '../shared/page-url.constants';
import {ErrorService} from '../services/error.service';

@Injectable({
  providedIn: 'root'
})
export class ConferenceGuard implements CanActivate {

  constructor(
    private route: ActivatedRoute,
    private videoWebService: VideoWebService,
    private router: Router,
    private errorService: ErrorService,
    private logger: Logger) { }

  async canActivate(next: ActivatedRouteSnapshot): Promise<boolean> {

    try {
      const conferenceId = next.paramMap.get('conferenceId');

      this.videoWebService.getConferenceById(conferenceId)
        .subscribe((data: ConferenceResponse) => {
            if (data.status === ConferenceStatus.Closed) {
              this.logger.info('Conference Guard - Returning back to hearing list because status closed');
              this.router.navigate([PageUrls.Home]);
              return false;
            } else {
              return true;
            }
          },
          (err) => {
            return this.handleError(err);
          });
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
