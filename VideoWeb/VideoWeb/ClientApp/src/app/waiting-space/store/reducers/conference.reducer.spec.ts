import { ConferenceStatus, EndpointStatus, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ConferenceActions } from '../actions/conference.actions';
import { VHConference, VHEndpoint, VHParticipant, VHRoom } from '../models/vh-conference';
import { ConferenceState, conferenceReducer, initialState } from './conference.reducer';
import { HearingRole } from '../../models/hearing-role-model';

function deepFreeze(object) {
    if (Object.isFrozen(object)) {
        return object;
    }

    const propNames = Object.getOwnPropertyNames(object);

    for (const name of propNames) {
        const value = object[name];

        object[name] = value && typeof value === 'object' ? deepFreeze(value) : value;
    }

    return Object.freeze(object);
}

describe('Conference Reducer', () => {
    let conferenceTestData: VHConference;
    let existingInitialState: ConferenceState;
    let originalRoom: VHRoom;

    beforeEach(() => {
        originalRoom = {
            label: 'Room 999',
            locked: false
        };

        conferenceTestData = {
            id: '123',
            caseName: 'Test Case',
            caseNumber: '123456',
            duration: 60,
            scheduledDateTime: new Date('2021-01-01T12:00:00Z'),
            status: ConferenceStatus.NotStarted,
            isVenueScottish: true,
            participants: [
                {
                    id: '0f497ffa-802c-4dfb-a3f2-208de0c10df7',
                    name: 'Mr John Doe',
                    username: 'john.doe@test.com',
                    status: ParticipantStatus.InConsultation,
                    tiledDisplayName: 'CIVILIAN;NO_HEARTBEAT;Mr John Doe;0f497ffa-802c-4dfb-a3f2-208de0c10df7',
                    room: originalRoom,
                    representee: '',
                    displayName: 'John Doe',
                    firstName: 'John',
                    lastName: 'Doe',
                    hearingRole: HearingRole.REPRESENTATIVE,
                    pexipInfo: undefined,
                    role: Role.Representative,
                    linkedParticipants: []
                },
                {
                    id: '7b875df1-bf37-4f5a-9d23-d3493f319a08',
                    name: 'Judge Fudge',
                    username: 'judge.fudge@test.com',
                    status: ParticipantStatus.Available,
                    tiledDisplayName: 'JUDGE;HEARTBEAT;Judge Fudge;7b875df1-bf37-4f5a-9d23-d3493f319a08',
                    displayName: 'Judge Fudge',
                    firstName: 'Judge',
                    lastName: 'Fudge',
                    hearingRole: HearingRole.JUDGE,
                    pexipInfo: undefined,
                    role: Role.Judge,
                    linkedParticipants: []
                },
                {
                    id: '729ae52a-f894-4680-af4b-4d9fcc6ffdaf',
                    name: 'Mr Chris Green',
                    username: 'chris.green@test.com',
                    status: ParticipantStatus.InConsultation,
                    tiledDisplayName: 'CIVILIAN;NO_HEARTBEAT;Mr Chris Green;729ae52a-f894-4680-af4b-4d9fcc6ffdaf',
                    room: originalRoom,
                    representee: '',
                    displayName: 'Chris Green',
                    firstName: 'Chris',
                    lastName: 'Green',
                    hearingRole: HearingRole.REPRESENTATIVE,
                    pexipInfo: undefined,
                    role: Role.Representative,
                    linkedParticipants: []
                }
            ],
            endpoints: [
                {
                    id: '197ced60-3cae-4214-8ba1-4465cffe4b5e',
                    displayName: 'Endpoint 1',
                    status: EndpointStatus.InConsultation,
                    defenceAdvocate: 'john.doe@test.com',
                    room: originalRoom
                },
                {
                    id: '197ced60-3cae-4214-8ba1-4465cffe4b5d',
                    displayName: 'Endpoint 2',
                    status: EndpointStatus.NotYetJoined,
                    defenceAdvocate: null,
                    room: null
                }
            ]
        };
        existingInitialState = {
            currentConference: conferenceTestData,
            availableRooms: [originalRoom]
        };
        deepFreeze(existingInitialState);
    });

    describe('an unknown action', () => {
        it('should return the previous state', () => {
            const action = {} as any;

            const result = conferenceReducer(initialState, action);

            expect(result).toBe(initialState);
        });
    });

    describe('loadConferenceSuccess action', () => {
        it('should set the current conference', () => {
            const result = conferenceReducer(initialState, ConferenceActions.loadConferenceSuccess({ conference: conferenceTestData }));

            expect(result.currentConference).toEqual(conferenceTestData);
        });

        it('should replace the existing conference with the new conference and maintain pexip info', () => {
            const conferenceWithPexipInfo: VHConference = {
                ...conferenceTestData,
                participants: [
                    {
                        ...conferenceTestData.participants[0],
                        pexipInfo: {
                            isRemoteMuted: false,
                            isSpotlighted: false,
                            handRaised: false,
                            pexipDisplayName: '1922_John Doe',
                            uuid: '1922_John Doe',
                            isAudioOnlyCall: false,
                            isVideoCall: true,
                            protocol: 'sip'
                        }
                    },
                    conferenceTestData.participants[1]
                ]
            };

            const initialStateWithPexipInfo: ConferenceState = { ...initialState, currentConference: conferenceWithPexipInfo };

            const conferenceWithoutPexipInfo: VHConference = { ...existingInitialState.currentConference, caseName: 'Updating conference' };
            const result = conferenceReducer(
                initialStateWithPexipInfo,
                ConferenceActions.loadConferenceSuccess({ conference: conferenceWithoutPexipInfo })
            );

            expect(result.currentConference.caseName).toEqual('Updating conference');
            expect(result.currentConference.participants[0].pexipInfo).toBeTruthy();
        });
    });

    describe('updateActiveConferenceStatus action', () => {
        it('should return the previous state if the conference does not exist', () => {
            const updatedStatus = ConferenceStatus.InSession;
            const result = conferenceReducer(
                initialState,
                ConferenceActions.updateActiveConferenceStatus({ conferenceId: conferenceTestData.id, status: updatedStatus })
            );

            expect(result).toEqual(initialState);
        });

        it('should return the previous state if the conference id does not match', () => {
            const updatedStatus = ConferenceStatus.InSession;
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateActiveConferenceStatus({ conferenceId: 'unknown', status: updatedStatus })
            );

            expect(result).toBe(existingInitialState);
        });

        it('should update the status of the current conference', () => {
            const updatedStatus = ConferenceStatus.InSession;
            const updatedResult = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateActiveConferenceStatus({ conferenceId: conferenceTestData.id, status: updatedStatus })
            );

            expect(updatedResult.currentConference.status).toBe(updatedStatus);
        });
    });

    describe('updateParticipantStatus action', () => {
        it('should return the previous state if the conference does not exist', () => {
            const updatedStatus = ParticipantStatus.Available;
            const result = conferenceReducer(
                initialState,
                ConferenceActions.updateParticipantStatus({
                    conferenceId: conferenceTestData.id,
                    participantId: conferenceTestData.participants[0].id,
                    status: updatedStatus
                })
            );

            expect(result).toBe(initialState);
        });

        it('should return the previous state if the conference id does not match', () => {
            const updatedStatus = ParticipantStatus.Available;
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantStatus({
                    conferenceId: 'unknown',
                    participantId: conferenceTestData.participants[0].id,
                    status: updatedStatus
                })
            );

            expect(result).toBe(existingInitialState);
        });

        it('should return the previous state if the participant does not exist', () => {
            const updatedStatus = ParticipantStatus.InHearing; // no participant has this status in existing initial state
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantStatus({
                    conferenceId: conferenceTestData.id,
                    participantId: 'unknown',
                    status: updatedStatus
                })
            );

            expect(result.currentConference.participants.some(p => p.status === updatedStatus)).toBeFalse();
        });

        it('should update the status of the participant', () => {
            const updatedStatus = ParticipantStatus.Available;
            const updatedResult = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantStatus({
                    conferenceId: conferenceTestData.id,
                    participantId: conferenceTestData.participants[0].id,
                    status: updatedStatus
                })
            );

            expect(updatedResult.currentConference.participants[0].status).toBe(updatedStatus);
        });

        it('should update the room of the participant to null when status is Disconnected', () => {
            const updatedStatus = ParticipantStatus.Disconnected;
            const updatedResult = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantStatus({
                    conferenceId: conferenceTestData.id,
                    participantId: conferenceTestData.participants[0].id,
                    status: updatedStatus
                })
            );

            expect(updatedResult.currentConference.participants[0].status).toBe(updatedStatus);
            expect(updatedResult.currentConference.participants[0].room).toBeNull();
            expect(updatedResult.currentConference.participants[0].pexipInfo).toBeNull();
        });
    });

    describe('updateEndpointStatus action', () => {
        it('should return the previous state if the conference does not exist', () => {
            const updatedStatus = EndpointStatus.Connected;
            const result = conferenceReducer(
                initialState,
                ConferenceActions.updateEndpointStatus({
                    conferenceId: conferenceTestData.id,
                    endpointId: conferenceTestData.endpoints[0].id,
                    status: updatedStatus
                })
            );

            expect(result).toBe(initialState);
        });

        it('should return the previous state if the conference id does not match', () => {
            const updatedStatus = EndpointStatus.Connected;
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateEndpointStatus({
                    conferenceId: 'unknown',
                    endpointId: conferenceTestData.endpoints[0].id,
                    status: updatedStatus
                })
            );

            expect(result).toBe(existingInitialState);
        });

        it('should return the previous state if the endpoint does not exist', () => {
            const updatedStatus = EndpointStatus.Connected;
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateEndpointStatus({
                    conferenceId: conferenceTestData.id,
                    endpointId: 'unknown',
                    status: updatedStatus
                })
            );

            expect(result.currentConference.endpoints.some(e => e.status === updatedStatus)).toBeFalse();
        });

        it('should update the status of the endpoint', () => {
            const updatedStatus = EndpointStatus.Connected;
            const updatedResult = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateEndpointStatus({
                    conferenceId: conferenceTestData.id,
                    endpointId: conferenceTestData.endpoints[0].id,
                    status: updatedStatus
                })
            );

            expect(updatedResult.currentConference.endpoints[0].status).toBe(updatedStatus);
        });

        it('should update the room of the endpoint to null when status is Disconnected', () => {
            const updatedStatus = EndpointStatus.Disconnected;
            const updatedResult = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateEndpointStatus({
                    conferenceId: conferenceTestData.id,
                    endpointId: conferenceTestData.endpoints[0].id,
                    status: updatedStatus
                })
            );

            expect(updatedResult.currentConference.endpoints[0].status).toBe(updatedStatus);
            expect(updatedResult.currentConference.endpoints[0].room).toBeNull();
        });

        it('should update the room of the endpoint to null when status is Disconnected', () => {
            const updatedStatus = EndpointStatus.Disconnected;
            const updatedResult = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateEndpointStatus({
                    conferenceId: conferenceTestData.id,
                    endpointId: conferenceTestData.endpoints[0].id,
                    status: updatedStatus
                })
            );

            expect(updatedResult.currentConference.endpoints[0].status).toBe(updatedStatus);
            expect(updatedResult.currentConference.endpoints[0].room).toBeNull();
            expect(updatedResult.currentConference.endpoints[0].pexipInfo).toBeNull();
        });
    });

    describe('updateParticipantList action', () => {
        it('should return the previous state if the conference does not exist', () => {
            const result = conferenceReducer(
                initialState,
                ConferenceActions.updateParticipantList({
                    conferenceId: conferenceTestData.id,
                    participants: conferenceTestData.participants
                })
            );

            expect(result).toBe(initialState);
        });

        it('should return the previous state if the conference id does not match', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantList({
                    conferenceId: 'unknown',
                    participants: conferenceTestData.participants
                })
            );

            expect(result).toBe(existingInitialState);
        });

        it('should return the previous state if the conference id does not match', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantList({
                    conferenceId: 'unknown',
                    participants: conferenceTestData.participants
                })
            );

            expect(result).toBe(existingInitialState);
        });

        it('should update the participant list', () => {
            const newParticipantsList: VHParticipant[] = [
                {
                    id: '0f497ffa-802c-4dfb-a3f2-208de0c10df7',
                    name: 'Mr John Doe',
                    username: 'john.doe@test.com',
                    status: ParticipantStatus.InConsultation,
                    tiledDisplayName: 'CIVILIAN;NO_HEARTBEAT;Mr John Doe;0f497ffa-802c-4dfb-a3f2-208de0c10df7',
                    room: { label: 'Room 1', locked: false },
                    representee: '',
                    displayName: 'John Doe',
                    firstName: 'John',
                    lastName: 'Doe',
                    hearingRole: HearingRole.REPRESENTATIVE,
                    role: Role.Representative,
                    linkedParticipants: []
                },
                {
                    id: '7b875df1-bf37-4f5a-9d23-d3493f319a08',
                    name: 'Judge New',
                    username: 'judge.new@test.com',
                    status: ParticipantStatus.NotSignedIn,
                    tiledDisplayName: 'JUDGE;HEARTBEAT;Judge New;7b875df1-bf37-4f5a-9d23-d3493f319a08',
                    displayName: 'Judge Fudge',
                    firstName: 'Judge',
                    lastName: 'Fudge',
                    hearingRole: HearingRole.JUDGE,
                    role: Role.Judge,
                    linkedParticipants: []
                }
            ];
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantList({
                    conferenceId: conferenceTestData.id,
                    participants: newParticipantsList
                })
            );

            // john doe remains but in a room, new judge and chris green is removed
            expect(result.currentConference.participants.length).toEqual(2);
            expect(result.currentConference.participants[0].name).toEqual('Mr John Doe');
            expect(result.currentConference.participants[0].room.label).toEqual('Room 1');
            expect(result.currentConference.participants[0].status).toEqual(ParticipantStatus.InConsultation);
            expect(result.currentConference.participants[1].name).toEqual('Judge New');
            expect(result.currentConference.participants.some(p => p.name === 'Mr Chris Green')).toBeFalse();

            expect(result.availableRooms.length).toEqual(2);
            expect(result.availableRooms[1].label).toEqual('Room 1');
        });
    });

    describe('updateExistingEndpoints actions', () => {
        it('should return the previous state if the conference does not exist', () => {
            const result = conferenceReducer(
                initialState,
                ConferenceActions.updateExistingEndpoints({
                    conferenceId: conferenceTestData.id,
                    endpoints: conferenceTestData.endpoints
                })
            );

            expect(result).toBe(initialState);
        });

        it('should return the previous state if the conference id does not match', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateExistingEndpoints({
                    conferenceId: 'unknown',
                    endpoints: conferenceTestData.endpoints
                })
            );

            expect(result).toBe(existingInitialState);
        });

        it('should update the existing endpoints', () => {
            const newEndpointsList = [
                {
                    id: conferenceTestData.endpoints[0].id,
                    displayName: 'Endpoint 1 Updated',
                    status: EndpointStatus.InConsultation,
                    defenceAdvocate: null,
                    room: { label: 'Room 1', locked: false }
                } as VHEndpoint
            ];
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateExistingEndpoints({
                    conferenceId: conferenceTestData.id,
                    endpoints: newEndpointsList
                })
            );

            expect(result.currentConference.endpoints.length).toEqual(2);
            expect(result.currentConference.endpoints[0].displayName).toEqual('Endpoint 1 Updated');
            expect(result.currentConference.endpoints[0].status).toEqual(EndpointStatus.InConsultation);
            expect(result.currentConference.endpoints[0].defenceAdvocate).toEqual(null);
            expect(result.currentConference.endpoints[0].room.label).toEqual('Room 1');
            expect(result.currentConference.endpoints[1]).toEqual(conferenceTestData.endpoints[1]);

            expect(result.availableRooms.length).toEqual(2);
            expect(result.availableRooms[1].label).toEqual('Room 1');
        });
    });

    describe('removeExistingEndpoints actions', () => {
        it('should return the previous state if the conference does not exist', () => {
            const result = conferenceReducer(
                initialState,
                ConferenceActions.removeExistingEndpoints({
                    conferenceId: conferenceTestData.id,
                    removedEndpointIds: [conferenceTestData.endpoints[0].id]
                })
            );

            expect(result).toBe(initialState);
        });

        it('should return the previous state if the conference id does not match', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.removeExistingEndpoints({
                    conferenceId: 'unknown',
                    removedEndpointIds: [conferenceTestData.endpoints[0].id]
                })
            );

            expect(result).toBe(existingInitialState);
        });

        it('should remove the existing endpoints', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.removeExistingEndpoints({
                    conferenceId: conferenceTestData.id,
                    removedEndpointIds: [conferenceTestData.endpoints[0].id]
                })
            );

            expect(result.currentConference.endpoints.length).toEqual(1);
            expect(result.currentConference.endpoints[0]).toEqual(conferenceTestData.endpoints[1]);
        });
    });

    describe('addNewEndpoints actions', () => {
        it('should return the previous state if the conference does not exist', () => {
            const result = conferenceReducer(
                initialState,
                ConferenceActions.addNewEndpoints({
                    conferenceId: conferenceTestData.id,
                    endpoints: conferenceTestData.endpoints
                })
            );

            expect(result).toBe(initialState);
        });

        it('should return the previous state if the conference id does not match', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.addNewEndpoints({
                    conferenceId: 'unknown',
                    endpoints: conferenceTestData.endpoints
                })
            );

            expect(result).toBe(existingInitialState);
        });

        it('should add the new endpoints', () => {
            const newEndpointsList: VHEndpoint[] = [
                {
                    id: conferenceTestData.endpoints[0].id,
                    displayName: 'Endpoint 1 Updated',
                    status: EndpointStatus.Connected,
                    defenceAdvocate: null,
                    room: null
                },
                {
                    id: '0f497ffa-802c-4dfb-a3f2-208de0c10df1',
                    displayName: 'Endpoint New',
                    status: EndpointStatus.Connected,
                    defenceAdvocate: 'chris.green@test.com',
                    room: null
                }
            ];
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.addNewEndpoints({
                    conferenceId: conferenceTestData.id,
                    endpoints: newEndpointsList
                })
            );

            // should ignore the first endpoint as it already exists
            expect(result.currentConference.endpoints.length).toEqual(3);
            expect(result.currentConference.endpoints[0]).toEqual(conferenceTestData.endpoints[0]);
            expect(result.currentConference.endpoints[1]).toEqual(conferenceTestData.endpoints[1]);

            // should add the new endpoint
            expect(result.currentConference.endpoints[2].displayName).toEqual('Endpoint New');
            expect(result.currentConference.endpoints[2].status).toEqual(EndpointStatus.Connected);
            expect(result.currentConference.endpoints[2].defenceAdvocate).toEqual('chris.green@test.com');
        });
    });

    describe('upsertPexipParticipant action', () => {
        it('should add pexip info to the participant', () => {
            const pexipParticipant = {
                isRemoteMuted: false,
                isSpotlighted: false,
                handRaised: false,
                pexipDisplayName: `1922_John Doe${conferenceTestData.participants[0].id}`,
                uuid: '1922_John Doe',
                isAudioOnlyCall: false,
                isVideoCall: true,
                protocol: 'sip'
            };
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.upsertPexipParticipant({ participant: pexipParticipant })
            );

            expect(result.currentConference.participants[0].pexipInfo).toEqual(pexipParticipant);
        });

        it('should add pexip info to the endpoint', () => {
            const pexipParticipant = {
                isRemoteMuted: false,
                isSpotlighted: false,
                handRaised: false,
                pexipDisplayName: `PTSN;${conferenceTestData.endpoints[0].displayName};${conferenceTestData.endpoints[0].id}`,
                uuid: '1922_John Doe',
                isAudioOnlyCall: false,
                isVideoCall: true,
                protocol: 'sip'
            };
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.upsertPexipParticipant({ participant: pexipParticipant })
            );

            expect(result.currentConference.endpoints[0].pexipInfo).toEqual(pexipParticipant);
        });

        it('should ignore pexip info to if participant is not on the list', () => {
            const pexipParticipant = {
                isRemoteMuted: false,
                isSpotlighted: false,
                handRaised: false,
                pexipDisplayName: '1922_John Doe_unknown',
                uuid: '1922_John Doe',
                isAudioOnlyCall: false,
                isVideoCall: true,
                protocol: 'sip'
            };
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.upsertPexipParticipant({ participant: pexipParticipant })
            );

            expect(result.currentConference.participants[0].pexipInfo).toBeFalsy();
        });
    });

    describe('deletePexipParticipant action', () => {
        it('should remove pexip info from the participant', () => {
            const initialStateWithPexipInfo = {
                ...existingInitialState,
                currentConference: {
                    ...existingInitialState.currentConference,
                    participants: [
                        {
                            ...existingInitialState.currentConference.participants[0],
                            pexipInfo: {
                                isRemoteMuted: false,
                                isSpotlighted: false,
                                handRaised: false,
                                pexipDisplayName: `1922_John Doe${conferenceTestData.participants[0].id}`,
                                uuid: '1922_John Doe',
                                isAudioOnlyCall: false,
                                isVideoCall: true,
                                protocol: 'sip'
                            }
                        }
                    ]
                }
            };
            const result = conferenceReducer(
                initialStateWithPexipInfo,
                ConferenceActions.deletePexipParticipant({ pexipUUID: '1922_John Doe' })
            );

            expect(result.currentConference.participants[0].pexipInfo).toBeFalsy();
        });

        it('should remove pexip info from the endpoint', () => {
            const initialStateWithPexipInfo: ConferenceState = {
                ...existingInitialState,
                currentConference: {
                    ...existingInitialState.currentConference,
                    endpoints: [
                        {
                            ...existingInitialState.currentConference.endpoints[0],
                            pexipInfo: {
                                isRemoteMuted: false,
                                isSpotlighted: false,
                                handRaised: false,
                                pexipDisplayName: `1922_John Doe${conferenceTestData.endpoints[0].id}`,
                                uuid: '1922_John Doe',
                                isAudioOnlyCall: false,
                                isVideoCall: true,
                                protocol: 'sip'
                            }
                        }
                    ]
                }
            };
            const result = conferenceReducer(
                initialStateWithPexipInfo,
                ConferenceActions.deletePexipParticipant({ pexipUUID: '1922_John Doe' })
            );

            expect(result.currentConference.endpoints[0].pexipInfo).toBeFalsy();
        });

        it('should ignore pexip info to if participant is not on the list', () => {
            const initialStateWithPexipInfo = {
                ...existingInitialState,
                currentConference: {
                    ...existingInitialState.currentConference,
                    participants: [
                        {
                            ...existingInitialState.currentConference.participants[0],
                            pexipInfo: {
                                isRemoteMuted: false,
                                isSpotlighted: false,
                                handRaised: false,
                                pexipDisplayName: `1922_John Doe${conferenceTestData.participants[0].id}`,
                                uuid: '1922_John Doe',
                                isAudioOnlyCall: false,
                                isVideoCall: true,
                                protocol: 'sip'
                            }
                        }
                    ]
                }
            };
            const result = conferenceReducer(initialStateWithPexipInfo, ConferenceActions.deletePexipParticipant({ pexipUUID: 'unknown' }));

            expect(result.currentConference.participants[0].pexipInfo).toBeTruthy();
        });
    });

    describe('updateRoom action', () => {
        it('should update the room in the available rooms list', () => {
            const updatedRoom = {
                label: 'Room 999',
                locked: true
            };
            const result = conferenceReducer(existingInitialState, ConferenceActions.updateRoom({ room: updatedRoom }));

            expect(result.availableRooms.length).toEqual(1);
            expect(result.availableRooms[0].label).toEqual('Room 999');
            expect(result.availableRooms[0].locked).toBeTrue();

            // John Doe
            expect(result.currentConference.participants[0].room).toEqual(updatedRoom);
            // Chris Green
            expect(result.currentConference.participants[2].room).toEqual(updatedRoom);
            // Endpoint 1
            expect(result.currentConference.endpoints[0].room).toEqual(updatedRoom);
        });

        it('should add the room to the available rooms list', () => {
            const newRoom: VHRoom = {
                label: 'Room 998',
                locked: false
            };
            const result = conferenceReducer(existingInitialState, ConferenceActions.updateRoom({ room: newRoom }));

            expect(result.availableRooms.length).toEqual(2);
            expect(result.availableRooms[1].label).toEqual('Room 998');
        });
    });

    describe('updateParticipantRoom action', () => {
        it('should return the previous state if the conference does not exist', () => {
            const result = conferenceReducer(
                initialState,
                ConferenceActions.updateParticipantRoom({
                    participantId: conferenceTestData.participants[0].id,
                    fromRoom: 'Room 999',
                    toRoom: 'Room 998'
                })
            );

            expect(result).toBe(initialState);
        });

        it('should return the previous state if the participant id does not match participant or an endpoint', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantRoom({
                    participantId: 'unknown',
                    fromRoom: 'Room 999',
                    toRoom: 'Room 998'
                })
            );

            expect(result).toBe(existingInitialState);
        });

        it('should update the participant room and set current room when room is a consultation room', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantRoom({
                    participantId: conferenceTestData.participants[0].id,
                    fromRoom: 'Room 999',
                    toRoom: 'Consultation Room 1'
                })
            );

            expect(result.currentConference.participants[0].room.label).toEqual('Consultation Room 1');
            expect(result.currentConference.participants[0].room.locked).toBeFalse();

            expect(result.availableRooms.length).toEqual(2);
        });

        it('should update the participant room and set current room when room is a hearing room', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantRoom({
                    participantId: conferenceTestData.participants[0].id,
                    fromRoom: 'Room 999',
                    toRoom: 'Hearing Room 1'
                })
            );

            expect(result.currentConference.participants[0].room).toBeNull();
        });

        it('should update the endpoint room and set the current room when room is a consultation room', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantRoom({
                    participantId: conferenceTestData.endpoints[0].id,
                    fromRoom: 'Room 999',
                    toRoom: 'Consultation Room 1'
                })
            );

            expect(result.currentConference.endpoints[0].room.label).toEqual('Consultation Room 1');
            expect(result.currentConference.endpoints[0].room.locked).toBeFalse();
        });

        it('should update the endpoint room and set the current room when room is a hearing room', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantRoom({
                    participantId: conferenceTestData.endpoints[0].id,
                    fromRoom: 'Room 999',
                    toRoom: 'Hearing Room 1'
                })
            );

            expect(result.currentConference.endpoints[0].room).toBeNull();
        });


        it('should update the conference state, after host changes their display name', () => {
            const result = conferenceReducer(
                existingInitialState,
                ConferenceActions.updateParticipantDisplayNameSuccess({
                    participantId: conferenceTestData.participants[0].id,
                    displayName: 'New Name',
                    conferenceId: conferenceTestData.id
                })
            );

            expect(result.currentConference.participants[0].displayName).toBe( 'New Name');
        });
    });
});
