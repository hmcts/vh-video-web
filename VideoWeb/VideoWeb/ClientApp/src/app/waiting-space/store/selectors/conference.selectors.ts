import { createSelector } from '@ngrx/store';
import { activeConferenceFeature } from '../reducers/conference.reducer';

export const getActiveConference = createSelector(activeConferenceFeature, state => state?.currentConference);
export const getParticipants = createSelector(activeConferenceFeature, state => state?.currentConference?.participants);
export const getEndpoints = createSelector(activeConferenceFeature, state => state?.currentConference?.endpoints);
export const getLoggedInParticipant = createSelector(activeConferenceFeature, state => state?.loggedInParticipant);
export const getParticipantByPexipId = (pexipId: string) =>
    createSelector(getParticipants, participants => participants?.find(p => p?.pexipInfo?.uuid === pexipId));
export const getEndpointByPexipId = (pexipId: string) =>
    createSelector(getEndpoints, endpoints => endpoints?.find(e => e?.pexipInfo?.uuid === pexipId));
