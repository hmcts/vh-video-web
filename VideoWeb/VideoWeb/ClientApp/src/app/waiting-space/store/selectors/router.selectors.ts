import { createSelector } from '@ngrx/store';
import { getRouterSelectors, RouterReducerState } from '@ngrx/router-store';

// Select the router state
export const selectRouter = (state: { router: RouterReducerState }) => state.router;

// Use NgRx's built-in selectors
export const { selectRouteParams } = getRouterSelectors(selectRouter);

// Selector to get conferenceId from route params
export const selectConferenceId = createSelector(
    selectRouteParams,
    params => params?.['conferenceId'] || null // Ensure it doesn't throw an error
);
