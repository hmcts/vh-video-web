import { ConferenceStatus, EndpointStatus, ParticipantStatus } from 'src/app/services/clients/api-client';
import { ConferenceActions } from '../actions/conference.actions';
import { VHConference, VHEndpoint, VHParticipant } from '../models/vh-conference';
import { ConferenceState, conferenceReducer, initialState } from './conference.reducer';

fdescribe('Conference Reducer', () => {
    let conferenceTestData: VHConference;
    let existingInitialState: ConferenceState;

    beforeEach(() => {
        conferenceTestData = {
            id: '123',
            caseName: 'Test Case',
            caseNumber: '123456',
            duration: 60,
            scheduledDateTime: new Date('2021-01-01T12:00:00Z'),
            status: ConferenceStatus.NotStarted,
            participants: [
                {
                    id: '0f497ffa-802c-4dfb-a3f2-208de0c10df7',
                    name: 'Mr John Doe',
                    username: 'john.doe@test.com',
                    status: ParticipantStatus.NotSignedIn,
                    tiledDisplayName: 'CIVILIAN;NO_HEARTBEAT;Mr John Doe;0f497ffa-802c-4dfb-a3f2-208de0c10df7'
                },
                {
                    id: '7b875df1-bf37-4f5a-9d23-d3493f319a08',
                    name: 'Judge Fudge',
                    username: 'judge.fudge@test.com',
                    status: ParticipantStatus.NotSignedIn,
                    tiledDisplayName: 'JUDGE;HEARTBEAT;Judge Fudge;7b875df1-bf37-4f5a-9d23-d3493f319a08'
                },
                {
                    id: '729ae52a-f894-4680-af4b-4d9fcc6ffdaf',
                    name: 'Mr Chris Green',
                    username: 'chris.green@test.com',
                    status: ParticipantStatus.NotSignedIn,
                    tiledDisplayName: 'CIVILIAN;NO_HEARTBEAT;Mr Chris Green;729ae52a-f894-4680-af4b-4d9fcc6ffdaf'
                }
            ],
            endpoints: [
                {
                    id: '197ced60-3cae-4214-8ba1-4465cffe4b5e',
                    displayName: 'Endpoint 1',
                    status: EndpointStatus.NotYetJoined,
                    defence_advocate: 'john.doe@test.com',
                    room: null
                },
                {
                    id: '197ced60-3cae-4214-8ba1-4465cffe4b5d',
                    displayName: 'Endpoint 2',
                    status: EndpointStatus.NotYetJoined,
                    defence_advocate: null,
                    room: null
                }
            ]
        };
        existingInitialState = {
            currentConference: conferenceTestData,
            availableRooms: [
                {
                    id: '999',
                    label: 'Room 999',
                    locked: false
                }
            ]
        };
    });

    describe('an unknown action', () => {
        it('should return the previous state', () => {
            const action = {} as any;

            const result = conferenceReducer(initialState, action);

            expect(result).toBe(initialState);
        });
    });

    describe('loadConferencesSuccess action', () => {
        it('should set the current conference', () => {
            const result = conferenceReducer(initialState, ConferenceActions.loadConferencesSuccess({ data: conferenceTestData }));

            expect(result.currentConference).toBe(conferenceTestData);
        });
    });

    describe('updateActiveConferenceStatus action', () => {
        it('should return the previous state if the conference does not exist', () => {
            const updatedStatus = ConferenceStatus.InSession;
            const result = conferenceReducer(
                initialState,
                ConferenceActions.updateActiveConferenceStatus({ conferenceId: conferenceTestData.id, status: updatedStatus })
            );

            expect(result).toBe(initialState);
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
            const result = conferenceReducer(existingInitialState, ConferenceActions.loadConferencesSuccess({ data: conferenceTestData }));
            const updatedResult = conferenceReducer(
                result,
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
            const updatedStatus = ParticipantStatus.Available;
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
            const result = conferenceReducer(existingInitialState, ConferenceActions.loadConferencesSuccess({ data: conferenceTestData }));
            const updatedResult = conferenceReducer(
                result,
                ConferenceActions.updateParticipantStatus({
                    conferenceId: conferenceTestData.id,
                    participantId: conferenceTestData.participants[0].id,
                    status: updatedStatus
                })
            );

            expect(updatedResult.currentConference.participants[0].status).toBe(updatedStatus);
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
            const result = conferenceReducer(existingInitialState, ConferenceActions.loadConferencesSuccess({ data: conferenceTestData }));
            const updatedResult = conferenceReducer(
                result,
                ConferenceActions.updateEndpointStatus({
                    conferenceId: conferenceTestData.id,
                    endpointId: conferenceTestData.endpoints[0].id,
                    status: updatedStatus
                })
            );

            expect(updatedResult.currentConference.endpoints[0].status).toBe(updatedStatus);
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
                    room: { id: '1', label: 'Room 1', locked: false }
                },
                {
                    id: '7b875df1-bf37-4f5a-9d23-d3493f319a08',
                    name: 'Judge New',
                    username: 'judge.new@test.com',
                    status: ParticipantStatus.NotSignedIn,
                    tiledDisplayName: 'JUDGE;HEARTBEAT;Judge New;7b875df1-bf37-4f5a-9d23-d3493f319a08'
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
                    defence_advocate: null,
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
            expect(result.currentConference.endpoints[0].defence_advocate).toEqual(null);
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
                    defence_advocate: null,
                    room: null
                },
                {
                    id: '0f497ffa-802c-4dfb-a3f2-208de0c10df1',
                    displayName: 'Endpoint New',
                    status: EndpointStatus.Connected,
                    defence_advocate: 'chris.green@test.com',
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
            expect(result.currentConference.endpoints[2].defence_advocate).toEqual('chris.green@test.com');
        });
    });
});
