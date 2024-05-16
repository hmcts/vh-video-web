import { createReducer, on } from '@ngrx/store';
import { ConferenceActions } from '../actions/conference.actions';
import { VHConference, VHEndpoint, VHParticipant, VHRoom } from '../models/vh-conference';

export const conferenceFeatureKey = 'active-conference';

export interface ConferenceState {
    currentConference: VHConference | undefined;
    availableRooms: VHRoom[];
}

export const initialState: ConferenceState = {
    currentConference: undefined,
    availableRooms: []
};

export const conferenceReducer = createReducer(
    initialState,
    on(ConferenceActions.loadConferencesSuccess, (state, { data }) => {
        return { ...state, currentConference: data };
    }),
    on(ConferenceActions.updateActiveConferenceStatus, (state, { conferenceId, status }) => {
        const conference = state.currentConference;
        if (!conference || conference.id !== conferenceId) {
            return state;
        }

        const updatedConference = { ...conference, status: status };
        return { ...state, currentConference: updatedConference };
    }),
    on(ConferenceActions.updateParticipantStatus, (state, { conferenceId, participantId, status }) => {
        const conference = state.currentConference;
        if (!conference || conference.id !== conferenceId) {
            return state;
        }

        const participants = conference.participants.map(participant => {
            if (participant.id === participantId) {
                return { ...participant, status: status };
            } else {
                return participant;
            }
        });

        const updatedConference = { ...conference, participants: participants };
        return { ...state, currentConference: updatedConference };
    }),
    on(ConferenceActions.updateParticipantList, (state, { conferenceId, participants }) => {
        const conference = state.currentConference;
        if (!conference || conference.id !== conferenceId) {
            return state;
        }

        const updatedList: VHParticipant[] = [];

        participants.forEach(p => {
            if (conference.participants.some(cp => cp.id === p.id)) {
                updatedList.push(p);
            }
        });
        const updatedConference = { ...conference, participants: participants };
        return { ...state, currentConference: updatedConference };
    }),
    on(ConferenceActions.updateEndpointList, (state, { conferenceId, endpoints }) => {
        const conference = state.currentConference;
        if (!conference || conference.id !== conferenceId) {
            return state;
        }

        const updatedList: VHEndpoint[] = [];

        endpoints.forEach(e => {
            if (conference.endpoints.some(ce => ce.id === e.id)) {
                updatedList.push(e);
            }
        });
        const updatedConference = { ...conference, endpoints: endpoints };
        return { ...state, currentConference: updatedConference };
    }),
    on(ConferenceActions.upsertPexipParticipant, (state, { participant }) => {
        const conference = state.currentConference;
        const participants = conference.participants.map(p => {
            if (participant.pexipDisplayName.includes(p.id)) {
                // Update the participant with the pexip info
                return { ...p, pexipInfo: participant };
            } else {
                return p;
            }
        });

        const updatedConference = { ...conference, participants: participants };
        return { ...state, currentConference: updatedConference };
    }),
    on(ConferenceActions.updateRoom, (state, { room }) => {
        // update room in the available rooms list
        // else add the room to the available rooms list
        const availableRooms = state.availableRooms;
        const roomIndex = availableRooms.findIndex(r => r.label === room.label);
        if (roomIndex > -1) {
            availableRooms[roomIndex] = room;
        } else {
            availableRooms.push(room);
        }
        return { ...state, availableRooms: availableRooms };
    })
);
