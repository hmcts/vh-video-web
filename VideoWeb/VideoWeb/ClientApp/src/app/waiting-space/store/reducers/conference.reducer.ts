import { createFeatureSelector, createReducer, on } from '@ngrx/store';
import { ConferenceActions } from '../actions/conference.actions';
import { VHConference, VHEndpoint, VHParticipant, VHRoom } from '../models/vh-conference';
import { EndpointStatus, ParticipantStatus } from 'src/app/services/clients/api-client';

export const conferenceFeatureKey = 'active-conference';

export interface ConferenceState {
    currentConference: VHConference | undefined;
    loggedInParticipant?: VHParticipant;
    availableRooms: VHRoom[];
}

export const initialState: ConferenceState = {
    currentConference: undefined,
    loggedInParticipant: undefined,
    availableRooms: []
};

function getCurrentConference(state: ConferenceState, conferenceId: string): VHConference {
    const conference = state.currentConference;
    if (!conference || conference.id !== conferenceId) {
        return null;
    }
    return conference;
}

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
        const conference = getCurrentConference(state, conferenceId);
        if (!conference) {
            return state;
        }

        const updatedConference: VHConference = { ...conference, status: status };
        return { ...state, currentConference: updatedConference };
    }),
    on(ConferenceActions.updateParticipantStatus, (state, { conferenceId, participantId, status }) => {
        const conference = getCurrentConference(state, conferenceId);
        if (!conference) {
            return state;
        }

        const participants = conference.participants.map(participant => {
            if (participant.id === participantId) {
                const updatedP: VHParticipant = {
                    ...participant,
                    status: status,
                    room: status === ParticipantStatus.Disconnected ? null : participant.room,
                    pexipInfo: status === ParticipantStatus.Disconnected ? null : participant.pexipInfo
                };
                return updatedP;
            } else {
                return participant;
            }
        });

        const updatedConference: VHConference = { ...conference, participants: participants };
        return { ...state, currentConference: updatedConference };
    }),
    on(ConferenceActions.updateEndpointStatus, (state, { conferenceId, endpointId, status }) => {
        const conference = getCurrentConference(state, conferenceId);
        if (!conference) {
            return state;
        }

        const endpoints = conference.endpoints.map(endpoint => {
            if (endpoint.id === endpointId) {
                const updatedEndpoint: VHEndpoint = {
                    ...endpoint,
                    status: status,
                    room: status === EndpointStatus.Disconnected ? null : endpoint.room,
                    pexipInfo: status === EndpointStatus.Disconnected ? null : endpoint.pexipInfo
                };
                return updatedEndpoint;
            } else {
                return endpoint;
            }
        });

        const updatedConference: VHConference = { ...conference, endpoints: endpoints };
        return { ...state, currentConference: updatedConference };
    }),
    on(ConferenceActions.updateParticipantList, (state, { conferenceId, participants }) => {
        const conference = getCurrentConference(state, conferenceId);
        if (!conference) {
            return state;
        }

        // retain the pexip info for the participants (this does not come from the API)
        const updatedParticipants = participants.map(p => {
            const existingParticipant: VHParticipant = conference.participants.find(cp => cp.id === p.id);
            const updatedParticipant: VHParticipant = { ...p, pexipInfo: existingParticipant?.pexipInfo };
            return updatedParticipant;
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
        const conference = getCurrentConference(state, conferenceId);
        if (!conference) {
            return state;
        }

        const updatedList: VHEndpoint[] = [];

        conference.endpoints.forEach(e => {
            if (endpoints.some(ep => ep.id === e.id)) {
                const updatedEndpoint: VHEndpoint = endpoints.find(ep => ep.id === e.id);
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
        const conference = getCurrentConference(state, conferenceId);
        if (!conference) {
            return state;
        }

        const updatedList = conference.endpoints.filter(e => !removedEndpointIds.includes(e.id));

        return { ...state, currentConference: { ...conference, endpoints: updatedList } };
    }),
    on(ConferenceActions.addNewEndpoints, (state, { conferenceId, endpoints }) => {
        const conference = getCurrentConference(state, conferenceId);
        if (!conference) {
            return state;
        }

        const newOnly = endpoints.filter(e => !conference.endpoints.some(ep => ep.id === e.id));
        const updatedList = [...conference.endpoints, ...newOnly];

        return { ...state, currentConference: { ...conference, endpoints: updatedList } };
    }),
    on(ConferenceActions.createPexipParticipant, ConferenceActions.upsertPexipParticipant, (state, { participant }) => {
        const conference = state.currentConference;
        const participants = conference.participants.map(p =>
            participant.pexipDisplayName?.includes(p.id) ? { ...p, pexipInfo: participant } : p
        );

        const endpoints = conference.endpoints.map(e =>
            participant.pexipDisplayName?.includes(e.id) ? { ...e, pexipInfo: participant } : e
        );

        return { ...state, currentConference: { ...conference, participants, endpoints } };
    }),
    on(ConferenceActions.deletePexipParticipant, (state, { pexipUUID }) => {
        const conference = state.currentConference;
        const participants = conference.participants.map(p => (p.pexipInfo?.uuid === pexipUUID ? { ...p, pexipInfo: null } : p));
        const endpoints = conference.endpoints.map(e => (e.pexipInfo?.uuid === pexipUUID ? { ...e, pexipInfo: null } : e));

        return { ...state, currentConference: { ...conference, participants, endpoints } };
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
    on(ConferenceActions.updateParticipantRoom, (state, { participantId, toRoom, fromRoom }) => {
        const participant = state.currentConference?.participants.find(p => p.id === participantId);
        const endpoint = state.currentConference?.endpoints.find(e => e.id === participantId);

        if (!participant && !endpoint) {
            return state;
        }

        let room: VHRoom = null;
        const isConsultationRoom = toRoom.toLowerCase().includes('consultation');
        if (isConsultationRoom) {
            room = state.availableRooms.find(r => r.label === toRoom) || { label: toRoom, locked: false };
        }

        // If room doesn't exist in availableRooms, add it
        let updatedAvailableRooms = state.availableRooms;
        if (isConsultationRoom && !state.availableRooms.find(r => r.label === room.label)) {
            updatedAvailableRooms = [...state.availableRooms, room];
        }

        if (!isConsultationRoom) {
            // if no endpoint or participant is in the room then remove it from the available rooms
            const roomParticipants = state.currentConference.participants.filter(
                p => p.id !== participantId && p.room && p.room.label === fromRoom
            );
            const roomEndpoints = state.currentConference.endpoints.filter(
                e => e.id !== participantId && e.room && e.room.label === fromRoom
            );
            if (roomParticipants.length === 0 && roomEndpoints.length === 0) {
                updatedAvailableRooms = state.availableRooms.filter(r => r.label !== fromRoom);
            }
        }

        if (participant) {
            const updatedParticipants = state.currentConference.participants.map(p => (p.id === participantId ? { ...p, room: room } : p));
            return {
                ...state,
                currentConference: { ...state.currentConference, participants: updatedParticipants },
                availableRooms: updatedAvailableRooms
            };
        }

        if (endpoint) {
            const updatedEndpoints = state.currentConference.endpoints.map(e => (e.id === participantId ? { ...e, room: room } : e));
            return {
                ...state,
                currentConference: { ...state.currentConference, endpoints: updatedEndpoints },
                availableRooms: updatedAvailableRooms
            };
        }

        return state;
    }),

    on(ConferenceActions.updateParticipantDisplayNameSuccess, (state, { displayName, participantId, conferenceId }) => {
        const conference = getCurrentConference(state, conferenceId);
        if (!conference) {
            return state;
        }

        const participants = conference.participants.map(participant => {
            if (participant.id === participantId) {
                const updatedP: VHParticipant = {
                    ...participant,
                    displayName: displayName
                };
                return updatedP;
            } else {
                return participant;
            }
        });

        const updatedConference: VHConference = { ...conference, participants: participants };
        return { ...state, currentConference: updatedConference };
    }),

    on(ConferenceActions.loadLoggedInParticipantSuccess, (state, { participant }) => {
        return { ...state, loggedInParticipant: participant };
    })
);

export const activeConferenceFeature = createFeatureSelector<ConferenceState>(conferenceFeatureKey);
