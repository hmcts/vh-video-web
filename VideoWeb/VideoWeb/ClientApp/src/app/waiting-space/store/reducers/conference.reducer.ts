import { createFeatureSelector, createReducer, on } from '@ngrx/store';
import { ConferenceActions } from '../actions/conference.actions';
import { VHConference, VHEndpoint, VHRoom } from '../models/vh-conference';

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
    on(ConferenceActions.loadConferenceSuccess, (state, { conference }) => {
        // retain the pexip info for the participants (this does not come from the API)
        const updatedParticipants = conference.participants.map(p => {
            const existingParticipant = state.currentConference?.participants.find(cp => cp.id === p.id);
            return { ...p, pexipInfo: existingParticipant?.pexipInfo };
        });
        const updatedConference: VHConference = { ...conference, participants: updatedParticipants };
        const availableRooms = conference.participants.map(p => p.room).filter(r => r !== null);
        return { ...state, currentConference: updatedConference, availableRooms: availableRooms };
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
    on(ConferenceActions.updateEndpointStatus, (state, { conferenceId, endpointId, status }) => {
        const conference = state.currentConference;
        if (!conference || conference.id !== conferenceId) {
            return state;
        }

        const endpoints = conference.endpoints.map(endpoint => {
            if (endpoint.id === endpointId) {
                return { ...endpoint, status: status };
            } else {
                return endpoint;
            }
        });

        const updatedConference = { ...conference, endpoints: endpoints };
        return { ...state, currentConference: updatedConference };
    }),
    on(ConferenceActions.updateParticipantList, (state, { conferenceId, participants }) => {
        const conference = state.currentConference;
        if (!conference || conference.id !== conferenceId) {
            return state;
        }
        // retain the pexip info for the participants (this does not come from the API)
        const updatedParticipants = participants.map(p => {
            const existingParticipant = conference.participants.find(cp => cp.id === p.id);
            return { ...p, pexipInfo: existingParticipant?.pexipInfo };
        });

        let updatedAvailableRooms: VHRoom[] = state.availableRooms;
        updatedParticipants.forEach(p => {
            if (p.room && !updatedAvailableRooms.some(r => r.label === p.room.label)) {
                updatedAvailableRooms = [...updatedAvailableRooms, p.room];
            }
        });
        const updatedConference: VHConference = { ...conference, participants: updatedParticipants };
        return { ...state, currentConference: updatedConference, availableRooms: updatedAvailableRooms };
    }),
    on(ConferenceActions.updateExistingEndpoints, (state, { conferenceId, endpoints }) => {
        const conference = state.currentConference;
        if (!conference || conference.id !== conferenceId) {
            return state;
        }

        const updatedList: VHEndpoint[] = [];

        conference.endpoints.forEach(e => {
            if (endpoints.some(ep => ep.id === e.id)) {
                const updatedEndpoint = endpoints.find(ep => ep.id === e.id);
                updatedList.push(updatedEndpoint);
            } else {
                updatedList.push(e);
            }
        });
        let updatedAvailableRooms: VHRoom[] = state.availableRooms;
        updatedList.forEach(e => {
            if (e.room && !updatedAvailableRooms.some(r => r.label === e.room.label)) {
                updatedAvailableRooms = [...updatedAvailableRooms, e.room];
            }
        });
        const updatedConference: VHConference = { ...conference, endpoints: updatedList };
        return { ...state, currentConference: updatedConference, availableRooms: updatedAvailableRooms };
    }),
    on(ConferenceActions.removeExistingEndpoints, (state, { conferenceId, removedEndpointIds }) => {
        const conference = state.currentConference;
        if (!conference || conference.id !== conferenceId) {
            return state;
        }

        const updatedList = conference.endpoints.filter(e => !removedEndpointIds.includes(e.id));

        return { ...state, currentConference: { ...conference, endpoints: updatedList } };
    }),
    on(ConferenceActions.addNewEndpoints, (state, { conferenceId, endpoints }) => {
        const conference = state.currentConference;
        if (!conference || conference.id !== conferenceId) {
            return state;
        }

        const newOnly = endpoints.filter(e => !conference.endpoints.some(ep => ep.id === e.id));
        const updatedList = [...conference.endpoints, ...newOnly];

        return { ...state, currentConference: { ...conference, endpoints: updatedList } };
    }),
    on(ConferenceActions.upsertPexipParticipant, (state, { participant }) => {
        const conference = state.currentConference;
        const participants = conference.participants.map(p =>
            participant.pexipDisplayName.includes(p.id) ? { ...p, pexipInfo: participant } : p
        );

        return { ...state, currentConference: { ...conference, participants } };
    }),
    on(ConferenceActions.deletePexipParticipant, (state, { pexipUUID }) => {
        const conference = state.currentConference;
        const participants = conference.participants.map(p => (p.pexipInfo?.uuid === pexipUUID ? { ...p, pexipInfo: null } : p));

        return { ...state, currentConference: { ...conference, participants } };
    }),
    on(ConferenceActions.updateRoom, (state, { room }) => {
        let updatedRoomList = state.availableRooms;
        let updatedParticipantsList = state.currentConference.participants;
        let updatedEndpointsList = state.currentConference.endpoints;
        const roomIndex = updatedRoomList.findIndex(r => r.label === room.label);

        if (roomIndex > -1) {
            updatedRoomList = updatedRoomList.map((item, index) => {
                if (index === roomIndex) {
                    return room;
                }
                return item;
            });
            updatedParticipantsList = state.currentConference.participants.map(p => {
                if (p.room && p.room.label === room.label) {
                    return { ...p, room };
                } else {
                    return p;
                }
            });
            updatedEndpointsList = state.currentConference.endpoints.map(e => {
                if (e.room && e.room.label === room.label) {
                    return { ...e, room };
                } else {
                    return e;
                }
            });
        } else {
            updatedRoomList = [...updatedRoomList, room];
        }

        return {
            ...state,
            availableRooms: updatedRoomList,
            currentConference: { ...state.currentConference, participants: updatedParticipantsList, endpoints: updatedEndpointsList }
        };
    }),
    on(ConferenceActions.updateParticipantRoom, (state, { participantId, toRoom }) => {
        const participant = state.currentConference?.participants.find(p => p.id === participantId);
        const endpoint = state.currentConference?.endpoints.find(e => e.id === participantId);

        if (!participant && !endpoint) {
            return state;
        }

        let room: VHRoom = null;
        if (toRoom.toLowerCase().includes('consultation')) {
            room = state.availableRooms.find(r => r.label === toRoom) || { label: toRoom, locked: false };
        }

        if (participant) {
            const updatedParticipants = state.currentConference.participants.map(p => (p.id === participantId ? { ...p, room: room } : p));
            return { ...state, currentConference: { ...state.currentConference, participants: updatedParticipants } };
        }

        if (endpoint) {
            const updatedEndpoints = state.currentConference.endpoints.map(e => (e.id === participantId ? { ...e, room: room } : e));
            return { ...state, currentConference: { ...state.currentConference, endpoints: updatedEndpoints } };
        }

        return state;
    })
);

export const activeConferenceFeature = createFeatureSelector<ConferenceState>(conferenceFeatureKey);
