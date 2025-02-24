import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { distinctUntilChanged, filter, map, withLatestFrom } from 'rxjs/operators';
import { ROUTER_NAVIGATION } from '@ngrx/router-store';
import { select, Store } from '@ngrx/store';
import { selectConferenceId } from '../selectors/router.selectors';
import { ConferenceActions } from '../actions/conference.actions';

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

    constructor(
        private actions$: Actions,
        private store: Store
    ) {}
}
