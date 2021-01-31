import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { from, Observable } from 'rxjs';
import { LoggedParticipantResponse } from '../../services/clients/api-client';

@Injectable()
export class LoggedUserResolveService implements Resolve<LoggedParticipantResponse> {
    constructor(private videoWebService: VideoWebService) {}

   resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<LoggedParticipantResponse> {
        const conferenceId = route.params['conferenceId'];
        return from( this.getData(conferenceId));
    }

    async getData(conferenceId) {
        return await this.videoWebService.getCurrentParticipant(conferenceId);
    }
}
