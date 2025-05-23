import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { Store, select } from '@ngrx/store';
import { merge } from 'rxjs';
import { filter, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ConferenceActions } from '../actions/conference.actions';
import { getActiveConference, getLoggedInParticipant } from '../selectors/conference.selectors';
import { ClockService } from 'src/app/services/clock.service';
import { RoomClosingToastrService } from 'src/app/waiting-space/services/room-closing-toast.service';
import { VHHearing } from 'src/app/shared/models/hearing.vh';
import { ParticipantStatus } from 'src/app/services/clients/api-client';

@Injectable()
export class WaitingRoomEffects {
    roomClosingNotification$ = createEffect(
        () =>
            this.store.pipe(
                select(getActiveConference),
                filter(conference => !!conference),
                switchMap(conference =>
                    this.store.pipe(
                        select(getLoggedInParticipant),
                        filter(participant => !!participant && participant.status === ParticipantStatus.InConsultation),
                        switchMap(() =>
                            this.clockService.getClock().pipe(
                                tap(now => {
                                    const vhHearing = new VHHearing(conference);
                                    this.roomClosingToastrService.showRoomClosingAlert(vhHearing, now);
                                }),
                                takeUntil(
                                    merge(
                                        this.store.pipe(
                                            select(getActiveConference),
                                            filter(c => !c)
                                        ),
                                        this.actions$.pipe(ofType(ConferenceActions.leaveConference)),
                                        this.store.pipe(
                                            select(getLoggedInParticipant),
                                            filter(p => !p || p.status !== ParticipantStatus.InConsultation)
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            ),
        { dispatch: false }
    );

    resetDismissedToasts$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.leaveConference, ConferenceActions.updateParticipantRoom),
                tap(() => {
                    this.roomClosingToastrService.clearToasts();
                    this.roomClosingToastrService.toastsDismissed = 0;
                })
            ),
        { dispatch: false }
    );

    constructor(
        private actions$: Actions,
        private store: Store,
        private clockService: ClockService,
        private roomClosingToastrService: RoomClosingToastrService
    ) {}
}
