import { createFeatureSelector, createReducer, on } from '@ngrx/store';
import { ConferenceActions } from '../actions/conference.actions';
import {
    VHConference,
    VHEndpoint,
    VHParticipant,
    VHPexipConference,
    VHPexipParticipant,
    VHRoom,
    VHConsultationCallStatus,
    SelfTestScore
} from '../models/vh-conference';
import { ConferenceStatus, EndpointStatus, ParticipantStatus } from 'src/app/services/clients/api-client';
import { VideoCallActions } from '../actions/video-call.action';
import { VideoCallHostActions } from '../actions/video-call-host.actions';
import { SelfTestActions } from '../actions/self-test.actions';
import { UserProfile } from '../models/user-profile';
import { AuthActions } from '../actions/auth.actions';

export const conferenceFeatureKey = 'active-conference';

export interface ConferenceState {
    currentConference: VHConference | undefined;
    pexipConference?: VHPexipConference;
    loggedInParticipant?: VHParticipant;
    userProfile?: UserProfile;
    availableRooms: VHRoom[];
    wowzaParticipant?: VHPexipParticipant;
    countdownComplete?: boolean;
    consultationStatuses?: VHConsultationCallStatus[];
    selfTestScore?: SelfTestScore;
}

export const initialState: ConferenceState = {
    currentConference: undefined,
    pexipConference: undefined,
    loggedInParticipant: undefined,
    userProfile: undefined,
    availableRooms: [],
    wowzaParticipant: undefined,
    countdownComplete: undefined,
    consultationStatuses: []
};

function getCurrentConference(state: ConferenceState, conferenceId: string): VHConference {
    const conference = state.currentConference;
    if (!conferenceId) {
        return conference;
    }
    if (!conference || conference.id !== conferenceId) {
        return null;
    }
    return conference;
}

const updateLoggedInParticipant = (state: ConferenceState, participants: VHParticipant[]) => {
    if (!state.loggedInParticipant) {
        return state;
    }
    const updatedParticipant = participants.find(p => p.id === state.loggedInParticipant.id);
    if (!updatedParticipant) {
        return state;
    }
    return { ...state, loggedInParticipant: { ...updatedParticipant } };
};

function distinctRoomLabels(rooms: VHRoom[]): VHRoom[] {
    const uniqueRooms: VHRoom[] = [];
    const labels = new Set<string>();

    for (const room of rooms) {
        if (room && !labels.has(room.label)) {
            labels.add(room.label);
            uniqueRooms.push(room);
        }
    }

    return uniqueRooms;
}

export const conferenceReducer = createReducer(
    initialState,
    on(ConferenceActions.loadConferenceSuccess, (state, { conference }) => {
        if (state.currentConference && state.currentConference.id !== conference.id) {
            // participants will get updates to other hearings they're booked to on the same day. We only want to update the current conference
            // To replace the hearing, dispatch the leaveConference action first
            return state;
        }
        // retain the pexip info and media device status for the participants (this does not come from the API)
        const updatedParticipants = conference.participants.map(p => {
            const existingParticipant = state.currentConference?.participants.find(cp => cp.id === p.id);
            return {
                ...p,
                pexipInfo: existingParticipant?.pexipInfo,
                localMediaStatus: existingParticipant?.localMediaStatus,
                transferDirection: undefined
            };
        });
        const updatedEndpoints = conference.endpoints.map(e => {
            const existingEndpoint = state.currentConference?.endpoints.find(ce => ce.id === e.id);
            return { ...e, pexipInfo: existingEndpoint?.pexipInfo, transferDirection: undefined } as VHEndpoint;
        });
        const updatedConference: VHConference = {
            ...conference,
            participants: updatedParticipants,
            endpoints: updatedEndpoints,
            countdownComplete: conference.countdownComplete
        };
        const availableRooms = distinctRoomLabels(conference.participants.map(p => p.room));
        const loggedInParticipant = updateLoggedInParticipant(state, updatedConference.participants).loggedInParticipant;
        return { ...state, currentConference: updatedConference, availableRooms: availableRooms, loggedInParticipant };
    }),
    on(ConferenceActions.leaveConference, _ => ({ ...initialState })),
    on(ConferenceActions.updateActiveConferenceStatus, (state, { conferenceId, status }) => {
        const conference = getCurrentConference(state, conferenceId);
        if (!conference) {
            return state;
        }

        let updatedParticipants = conference.participants;
        if (status === ConferenceStatus.Paused || status === ConferenceStatus.Suspended) {
            // reset the transfer direction for all participants
            updatedParticipants = conference.participants.map(p => ({ ...p, transferDirection: undefined }));
        }

        const updatedConference: VHConference = {
            ...conference,
            status: status,
            countdownComplete: null,
            participants: updatedParticipants
        };
        return { ...state, currentConference: updatedConference };
    }),
    on(ConferenceActions.upsertPexipConference, (state, { pexipConference: conference }) => ({ ...state, pexipConference: conference })),
    on(ConferenceActions.countdownComplete, (state, { conferenceId }) => {
        const conference = getCurrentConference(state, conferenceId);
        if (!conference) {
            return state;
        }

        const updatedConference: VHConference = { ...conference, countdownComplete: true };
        return { ...state, currentConference: updatedConference };
    }),
    // self test
    on(SelfTestActions.retrieveSelfTestScoreSuccess, (state, { score }) => ({ ...state, selfTestScore: score })),
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
                    pexipInfo: status === ParticipantStatus.Disconnected ? null : participant.pexipInfo,
                    transferDirection: undefined
                };
                return updatedP;
            } else {
                return participant;
            }
        });

        // remove participant from consultation statuses
        const updatedConsultationStatuses = state.consultationStatuses.filter(
            consultationStatus => consultationStatus.participantId !== participantId && consultationStatus.requestedFor !== participantId
        );

        const updatedConference: VHConference = { ...conference, participants: participants };
        const loggedInParticipant = updateLoggedInParticipant(state, updatedConference.participants).loggedInParticipant;
        return { ...state, currentConference: updatedConference, loggedInParticipant, consultationStatuses: updatedConsultationStatuses };
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
                    pexipInfo: status === EndpointStatus.Disconnected ? null : endpoint.pexipInfo,
                    transferDirection: undefined
                };
                return updatedEndpoint;
            } else {
                return endpoint;
            }
        });

        const updatedConference: VHConference = { ...conference, endpoints: endpoints };
        return { ...state, currentConference: updatedConference };
    }),
    on(ConferenceActions.updateParticipantHearingTransferStatus, (state, { conferenceId, participantId, transferDirection }) => {
        const conference = getCurrentConference(state, conferenceId);
        if (!conference) {
            return state;
        }

        const participants = conference.participants.map(p =>
            p.id === participantId ? { ...p, transferDirection: transferDirection } : p
        );
        const endpoints = conference.endpoints.map(e => (e.id === participantId ? { ...e, transferDirection: transferDirection } : e));
        const updatedConference: VHConference = { ...conference, participants: participants, endpoints: endpoints };
        const loggedInParticipant = updateLoggedInParticipant(state, updatedConference.participants).loggedInParticipant;
        return { ...state, currentConference: updatedConference, loggedInParticipant };
    }),
    on(ConferenceActions.updateParticipantMediaStatus, (state, { participantId, conferenceId, mediaStatus }) => {
        const conference = getCurrentConference(state, conferenceId);
        if (!conference) {
            return state;
        }

        const participants = conference.participants.map(p =>
            p.id === participantId
                ? {
                      ...p,
                      localMediaStatus: {
                          isCameraOff: mediaStatus.is_local_video_muted,
                          isMicrophoneMuted: mediaStatus.is_local_audio_muted
                      }
                  }
                : p
        );
        const updatedConference: VHConference = { ...conference, participants: participants };
        const loggedInParticipant = updateLoggedInParticipant(state, updatedConference.participants).loggedInParticipant;
        return { ...state, currentConference: updatedConference, loggedInParticipant };
    }),
    on(ConferenceActions.updateParticipantList, (state, { conferenceId, participants }) => {
        const conference = getCurrentConference(state, conferenceId);
        if (!conference) {
            return state;
        }

        // retain the pexip info for the participants (this does not come from the API)
        const updatedParticipants = participants.map(p => {
            const existingParticipant: VHParticipant = conference.participants.find(cp => cp.id === p.id);
            const updatedParticipant: VHParticipant = {
                ...p,
                pexipInfo: existingParticipant?.pexipInfo,
                localMediaStatus: existingParticipant?.localMediaStatus
            };
            return updatedParticipant;
        });

        const updatedAvailableRooms = distinctRoomLabels([
            ...updatedParticipants.map(p => p.room, ...conference.endpoints.map(e => e.room))
        ]);
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

        const updatedAvailableRooms = distinctRoomLabels([...updatedList.map(p => p.room, ...conference.participants.map(e => e.room))]);

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
        const conference = getCurrentConference(state, null);
        if (!conference) {
            return state;
        }
        const participants = conference.participants.map(p =>
            participant.pexipDisplayName?.includes(p.id) ? { ...p, pexipInfo: participant } : p
        );

        const endpoints = conference.endpoints.map(e =>
            participant.pexipDisplayName?.includes(e.id) ? { ...e, pexipInfo: participant } : e
        );

        let wowzaParticipant = state.wowzaParticipant;
        if (participant.pexipDisplayName?.toLowerCase().includes('wowza')) {
            wowzaParticipant = participant;
        }

        const loggedInParticipant = updateLoggedInParticipant(state, participants).loggedInParticipant;
        return { ...state, currentConference: { ...conference, participants, endpoints }, wowzaParticipant, loggedInParticipant };
    }),
    on(ConferenceActions.deletePexipParticipant, (state, { pexipUUID }) => {
        const conference = getCurrentConference(state, null);
        if (!conference) {
            return state;
        }
        const participants = conference.participants.map(p => (p.pexipInfo?.uuid === pexipUUID ? { ...p, pexipInfo: null } : p));
        const endpoints = conference.endpoints.map(e => (e.pexipInfo?.uuid === pexipUUID ? { ...e, pexipInfo: null } : e));

        let wowzaParticipant = state.wowzaParticipant;
        if (wowzaParticipant?.uuid === pexipUUID) {
            wowzaParticipant = null;
        }

        const loggedInParticipant = updateLoggedInParticipant(state, participants).loggedInParticipant;
        return { ...state, currentConference: { ...conference, participants, endpoints }, wowzaParticipant, loggedInParticipant };
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
        const loggedInParticipant = updateLoggedInParticipant(state, updatedParticipantsList).loggedInParticipant;
        return {
            ...state,
            availableRooms: updatedRoomList,
            currentConference: { ...state.currentConference, participants: updatedParticipantsList, endpoints: updatedEndpointsList },
            loggedInParticipant
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
            const loggedInParticipant = updateLoggedInParticipant(state, updatedParticipants).loggedInParticipant;
            return {
                ...state,
                currentConference: { ...state.currentConference, participants: updatedParticipants },
                availableRooms: updatedAvailableRooms,
                loggedInParticipant
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
        const loggedInParticipant = updateLoggedInParticipant(state, updatedConference.participants).loggedInParticipant;
        return { ...state, currentConference: updatedConference, loggedInParticipant };
    }),
    on(ConferenceActions.loadLoggedInParticipantSuccess, (state, { participant }) => ({
        ...state,
        loggedInParticipant: participant
    })),
    on(ConferenceActions.updateAudioMix, (state, { participant, interpreterLanguage, mainCourt }) => {
        const conference = getCurrentConference(state, null);
        if (!conference) {
            return state;
        }
        if (!conference) {
            return state;
        }

        const participantId = participant.id;
        const participants = conference.participants.map(p => {
            if (participant.id === participantId) {
                const updatedP: VHParticipant = {
                    ...p,
                    currentAudioMix: mainCourt ? 'main' : interpreterLanguage?.code
                };
                return updatedP;
            } else {
                return p;
            }
        });

        const updatedConference: VHConference = { ...conference, participants: participants };
        const loggedInParticipant = updateLoggedInParticipant(state, updatedConference.participants).loggedInParticipant;
        return { ...state, currentConference: updatedConference, loggedInParticipant };
    }),
    on(ConferenceActions.upsertConsultationCallStatus, (state, { invitationId, roomLabel, requestedBy, requestedFor, callStatus }) => {
        const index = state.consultationStatuses.findIndex(
            status => status.participantId === requestedFor && status.invitationId === invitationId
        );

        const participant = state.currentConference.participants.find(p => p.id === requestedFor);
        const updatedStatuses = [...state.consultationStatuses];

        state.currentConference.participants.forEach(p => {
            if (p.protectedFrom?.includes(participant.externalReferenceId)) {
                updatedStatuses.push({
                    participantId: p.id,
                    callStatus: 'Protected'
                } as VHConsultationCallStatus);
            }
            if (participant.protectedFrom?.includes(p.externalReferenceId)) {
                updatedStatuses.push({
                    participantId: p.id,
                    callStatus: 'Protected'
                } as VHConsultationCallStatus);
            }
        });

        if (index > -1) {
            const existingStatus = updatedStatuses[index];
            updatedStatuses[index] = {
                ...existingStatus,
                callStatus: callStatus,
                roomLabel: roomLabel,
                invitationId: invitationId
            };
        } else {
            updatedStatuses.push({
                participantId: requestedFor,
                requestedBy: requestedBy,
                requestedFor: requestedFor,
                invitationId: invitationId,
                roomLabel: roomLabel,
                callStatus: callStatus
            });
        }

        return { ...state, consultationStatuses: updatedStatuses };
    }),
    on(ConferenceActions.consultationResponded, (state, { invitationId, requestedFor, answer }) => {
        const updatedStatuses = state.consultationStatuses.map(status => {
            if (status.participantId === requestedFor && status.invitationId === invitationId) {
                return { ...status, callStatus: answer };
            }
            return status;
        });

        return { ...state, consultationStatuses: updatedStatuses };
    }),
    on(ConferenceActions.clearConsultationCallStatus, (state, { requestedFor, invitationId }) => {
        const updatedStatuses = state.consultationStatuses.filter(
            status => status.participantId !== requestedFor && status.invitationId !== invitationId
        );
        return { ...state, consultationStatuses: updatedStatuses };
    }),

    // Video Call Control - potentially remove the below actions if pexip client can manage cam and mic mute?
    on(VideoCallActions.toggleAudioMuteSuccess, (state, { participantId, isMuted }) => {
        const updatedParticipants = state.currentConference.participants.map(p =>
            p.id === participantId ? { ...p, localMediaStatus: { ...p.localMediaStatus, isMicrophoneMuted: isMuted } } : p
        );
        const updatedConference: VHConference = { ...state.currentConference, participants: updatedParticipants };
        const loggedInParticipant = updateLoggedInParticipant(state, updatedConference.participants).loggedInParticipant;
        return { ...state, currentConference: updatedConference, loggedInParticipant };
    }),
    on(VideoCallActions.toggleOutgoingVideoSuccess, (state, { participantId, isVideoOn }) => {
        const updatedParticipants = state.currentConference.participants.map(p =>
            p.id === participantId ? { ...p, localMediaStatus: { ...p.localMediaStatus, isCameraOff: !isVideoOn } } : p
        );
        const updatedConference: VHConference = { ...state.currentConference, participants: updatedParticipants };
        const loggedInParticipant = updateLoggedInParticipant(state, updatedConference.participants).loggedInParticipant;
        return { ...state, currentConference: updatedConference, loggedInParticipant };
    }),
    // Video Call Host Controls
    on(VideoCallHostActions.admitParticipantFailure, state => {
        // set participant transfer direction to none
        const updatedParticipants = state.currentConference.participants.map(p => ({ ...p, transferDirection: undefined }));
        const updatedConference: VHConference = { ...state.currentConference, participants: updatedParticipants };
        return { ...state, currentConference: updatedConference };
    }),
    on(AuthActions.loadUserProfileSuccess, (state, { userProfile }) => ({ ...state, userProfile }))
);

export const videocallControlsReducer = createReducer(initialState);

export const activeConferenceFeature = createFeatureSelector<ConferenceState>(conferenceFeatureKey);
