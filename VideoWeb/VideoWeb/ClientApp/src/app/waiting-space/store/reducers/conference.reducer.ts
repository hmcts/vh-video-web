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

        // create a list of rooms based on the participants
        const rooms: VHRoom[] = state.availableRooms;
        participants.forEach(p => {
            if (p.room && !rooms.some(r => r.label === p.room.label)) {
                rooms.push(p.room);
            }
        });
        const updatedConference = { ...conference, participants: participants, rooms };
        return { ...state, currentConference: updatedConference };
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
        const rooms: VHRoom[] = state.availableRooms;
        updatedList.forEach(e => {
            if (e.room && !rooms.some(r => r.label === e.room.label)) {
                rooms.push(e.room);
            }
        });
        const updatedConference = { ...conference, endpoints: updatedList };
        return { ...state, currentConference: updatedConference };
    }),
    on(ConferenceActions.removeExistingEndpoints, (state, { conferenceId, removedEndpointIds }) => {
        const conference = state.currentConference;
        if (!conference || conference.id !== conferenceId) {
            return state;
        }

        const updatedList = conference.endpoints.filter(e => !removedEndpointIds.some(ep => ep === e.id));
        const updatedConference = { ...conference, endpoints: updatedList };
        return { ...state, currentConference: updatedConference };
    }),
    on(ConferenceActions.addNewEndpoints, (state, { conferenceId, endpoints }) => {
        const conference = state.currentConference;
        if (!conference || conference.id !== conferenceId) {
            return state;
        }

        // filter out any endpoints that already exist
        const newOnly = endpoints.filter(e => !conference.endpoints.some(ep => ep.id === e.id));
        const updatedList = conference.endpoints.concat(newOnly);
        const updatedConference = { ...conference, endpoints: updatedList };
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
        const updatedList = state.availableRooms;
        const roomIndex = updatedList.findIndex(r => r.label === room.label);
        if (roomIndex > -1) {
            updatedList[roomIndex] = room;
            state.currentConference.participants.forEach(p => {
                if (p.room && p.room.label === room.label) {
                    p.room = room;
                }
            });
            state.currentConference.endpoints.forEach(e => {
                if (e.room && e.room.label === room.label) {
                    e.room = room;
                }
            });
        } else {
            updatedList.push(room);
        }
        return { ...state, availableRooms: updatedList };
    }),
    on(ConferenceActions.updateParticipantRoom, (state, { participantId, fromRoom, toRoom }) => {
        const conference = state.currentConference;
        if (!conference) {
            return state;
        }

        const participant = conference.participants.find(p => p.id === participantId);
        const endpoint = conference.endpoints.find(e => e.id === participantId);

        if (!participant && !endpoint) {
            return state;
        }

        let room: VHRoom = null;
        if (toRoom.toLowerCase().startsWith('consultation')) {
            room = state.availableRooms.find(r => r.label === toRoom);
            if (!room) {
                room = { label: toRoom, locked: false };
            }
        }

        // TODO: confirm if we should add the room to the available rooms list if new
        if (participant) {
            const updatedParticipant = { ...participant, room: room };
            const participants = conference.participants.map(p => {
                if (p.id === participantId) {
                    return updatedParticipant;
                } else {
                    return p;
                }
            });

            const updatedConference = { ...conference, participants: participants };
            return { ...state, currentConference: updatedConference };
        }

        if (endpoint) {
            const updatedEndpoint = { ...endpoint, room: room };
            const endpoints = conference.endpoints.map(e => {
                if (e.id === participantId) {
                    return updatedEndpoint;
                } else {
                    return e;
                }
            });

            const updatedConference = { ...conference, endpoints: endpoints };
            return { ...state, currentConference: updatedConference };
        }

        return state;
    })
);
