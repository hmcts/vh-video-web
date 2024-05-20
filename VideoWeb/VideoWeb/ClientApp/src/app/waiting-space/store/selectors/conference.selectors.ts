import { createSelector } from '@ngrx/store';
import { activeConferenceFeature } from '../reducers/conference.reducer';

// export const getActiveConference = (state: ConferenceState) => state.currentConference;
export const getActiveConference = createSelector(activeConferenceFeature, state => state.currentConference);
export const getParticipants = createSelector(activeConferenceFeature, state => state.currentConference.participants);
export const getEndpoints = createSelector(activeConferenceFeature, state => state.currentConference.endpoints);
