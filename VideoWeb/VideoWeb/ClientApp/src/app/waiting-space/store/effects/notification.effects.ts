import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { tap } from 'rxjs/operators';
import { ConferenceActions } from '../actions/conference.actions';
import { NotificationToastrService } from '../../services/notification-toastr.service';
import { Store } from '@ngrx/store';
import { ConferenceState } from '../reducers/conference.reducer';

import * as ConferenceSelectors from '../selectors/conference.selectors';
import { ParticipantStatus, Role } from 'src/app/services/clients/api-client';

@Injectable()
export class NotificationEffects {
    participantLeaveHearingRoomSuccess$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.participantLeaveHearingRoomSuccess),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getActiveConference),
                    this.store.select(ConferenceSelectors.getLoggedInParticipant)
                ]),
                tap(([action, activeConference, loggedInParticipant]) => {
                    const isHost = loggedInParticipant?.role === Role.Judge || loggedInParticipant?.role === Role.StaffMember;
                    if (activeConference.id !== action.conferenceId) {
                        return;
                    }
                    if (!isHost) {
                        return;
                    }

                    this.toastNotificationService.showParticipantLeftHearingRoom(
                        action.participant,
                        loggedInParticipant.status === ParticipantStatus.InConsultation ||
                            loggedInParticipant.status === ParticipantStatus.InHearing
                    );
                })
            ),
        { dispatch: false }
    );

    constructor(
        private actions$: Actions,
        private store: Store<ConferenceState>,
        private toastNotificationService: NotificationToastrService
    ) {}
}
