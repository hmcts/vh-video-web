import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { distinctUntilChanged, filter, map, tap, withLatestFrom } from 'rxjs/operators';
import { ROUTER_NAVIGATION } from '@ngrx/router-store';
import { select, Store } from '@ngrx/store';
import { selectConferenceId } from '../selectors/router.selectors';
import { ConferenceActions } from '../actions/conference.actions';
import { Title } from '@angular/platform-browser';
import { concatLatestFrom } from '@ngrx/operators';
import * as ConferenceSelectors from '../selectors/conference.selectors';
import { NonHostUserRole } from '../../waiting-room-shared/models/non-host-user-role';

@Injectable()
export class RouterEffects {
    trackConferenceNavigation$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ROUTER_NAVIGATION), // Listen for router navigation
            withLatestFrom(this.store.pipe(select(selectConferenceId))), // Get the conferenceId
            filter(([_, conferenceId]) => !!conferenceId), // Ensure conferenceId exists
            distinctUntilChanged(([, prevConferenceId], [, nextConferenceId]) => prevConferenceId === nextConferenceId), // Ensure the conferenceId has changed
            map(([_, conferenceId]) => ConferenceActions.loadConference({ conferenceId }))
        )
    );

    roomTransfer$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.updateParticipantRoom),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getLoggedInParticipant),
                    this.store.select(ConferenceSelectors.getActiveConference)
                ]),
                filter(
                    ([action, loggedInParticipant, activeConference]) =>
                        !!activeConference && !!loggedInParticipant && action.participantId === loggedInParticipant.id
                ),
                tap(([action]) => {
                    const room: string = action.toRoom;
                    let title = 'Video Hearings - Waiting Room';
                    if (room.includes('JudgeConsultationRoom') || room.includes('JudgeJOHConsultationRoom')) {
                        title = 'Video Hearings - JOH Consultation Room';
                    } else if (room.includes('ConsultationRoom')) {
                        title = 'Video Hearings - Private Consultation Room';
                    } else if (room.includes('HearingRoom')) {
                        title = 'Video Hearings - Hearing Room';
                    }
                    this.titleService.setTitle(title);
                })
            ),
        { dispatch: false }
    );

    setWaitingRoomPageTitle$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.enterWaitingRoomAsNonHost),
                tap(({ userRole }) => {
                    let title = 'Participant waiting room';
                    if (userRole === NonHostUserRole.Joh) {
                        title = 'JOH waiting room';
                    }
                    this.titleService.setTitle(title);
                })
            ),
        { dispatch: false }
    );

    constructor(
        private actions$: Actions,
        private store: Store,
        private titleService: Title
    ) {}
}
