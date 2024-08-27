import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { tap } from 'rxjs/operators';
import { ConferenceActions } from '../actions/conference.actions';
import { ConferenceState } from '../reducers/conference.reducer';
import { Store } from '@ngrx/store';
import { NotificationToastrService } from '../../services/notification-toastr.service';
import { ConferenceStatus } from 'src/app/services/clients/api-client';

@Injectable()
export class NotificationEffects {
    participantLeaveHearingRoomSuccess$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.participantLeaveHearingRoomSuccess),
                tap(action => {
                    this.toastNotificationService.showParticipantLeftHearingRoom(
                        action.participant,
                        action.conference.status === ConferenceStatus.InSession
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
