import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { from, Observable } from 'rxjs';
import { LoggedParticipantResponse } from '../../services/clients/api-client';
import { Store } from '@ngrx/store';
import { ConferenceState } from '../store/reducers/conference.reducer';
import { ConferenceActions } from '../store/actions/conference.actions';

@Injectable()
export class LoggedUserResolveService {
    constructor(
        private videoWebService: VideoWebService,
        private conferenceStore: Store<ConferenceState>
    ) {}

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<LoggedParticipantResponse> {
        const conferenceId = route.params['conferenceId'];
        return from(this.getData(conferenceId));
    }

    async getData(conferenceId) {
        const participant = await this.videoWebService.getCurrentParticipant(conferenceId);
        this.conferenceStore.dispatch(ConferenceActions.loadLoggedInParticipant({ participantId: participant.participant_id }));
        return participant;
    }
}
