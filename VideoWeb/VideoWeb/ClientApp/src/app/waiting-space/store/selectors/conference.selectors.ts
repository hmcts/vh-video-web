import { createSelector } from '@ngrx/store';
import { activeConferenceFeature } from '../reducers/conference.reducer';

export const getActiveConference = createSelector(activeConferenceFeature, state => state?.currentConference);
export const getPexipConference = createSelector(activeConferenceFeature, state => state?.pexipConference);
export const getParticipants = createSelector(activeConferenceFeature, state => state?.currentConference?.participants);
export const getEndpoints = createSelector(activeConferenceFeature, state => state?.currentConference?.endpoints);
export const getLoggedInParticipant = createSelector(activeConferenceFeature, state => state?.loggedInParticipant);
export const getParticipantById = (id: string) => createSelector(getParticipants, participants => participants?.find(p => p?.id === id));
export const getCountdownComplete = createSelector(activeConferenceFeature, state => state?.currentConference?.countdownComplete);
export const getWowzaParticipant = createSelector(activeConferenceFeature, state => state?.wowzaParticipant);
export const getParticipantByPexipId = (pexipId: string) =>
    createSelector(getParticipants, participants => participants?.find(p => p?.pexipInfo?.uuid === pexipId));
export const getEndpointByPexipId = (pexipId: string) =>
    createSelector(getEndpoints, endpoints => endpoints?.find(e => e?.pexipInfo?.uuid === pexipId));
export const getSelfTestScore = createSelector(activeConferenceFeature, state => state?.selfTestScore);
export const getUserProfile = createSelector(activeConferenceFeature, state => state?.userProfile);
export const getAvailableRooms = createSelector(activeConferenceFeature, state => state?.availableRooms);
export const getConsultationStatuses = createSelector(activeConferenceFeature, state => state?.consultationStatuses);
export const getAudioRecordingState = createSelector(activeConferenceFeature, state => state?.audioRecordingState);
