import { EndpointStatus, ParticipantStatus } from 'src/app/services/clients/api-client';
import { ConferenceActions } from '../actions/conference.actions';
import { VHConference } from '../models/vh-conference';
import { conferenceReducer, initialState } from './conference.reducer';

fdescribe('Conference Reducer', () => {
    let conferenceTestData: VHConference;

    beforeEach(() => {
        conferenceTestData = {
            id: '123',
            caseName: 'Test Case',
            caseNumber: '123456',
            duration: 60,
            scheduledDateTime: new Date('2021-01-01T12:00:00Z'),
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
                    defence_advocate: 'john.doe@test.com'
                },
                {
                    id: '197ced60-3cae-4214-8ba1-4465cffe4b5d',
                    displayName: 'Endpoint 2',
                    status: EndpointStatus.NotYetJoined,
                    defence_advocate: null
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
        it('should update the status of the current conference', () => {
            const conferenceTestData: VHConference = {
                id: '123',
                caseName: 'Test Case',
                caseNumber: '123456',
                duration: 60,
                scheduledDateTime: new Date('2021-01-01T12:00:00Z'),
                participants: [],
                endpoints: []
            };
            const updatedStatus = 'InSession';
            const result = conferenceReducer(initialState, ConferenceActions.loadConferencesSuccess({ data: conferenceTestData }));
            const updatedResult = conferenceReducer(
                result,
                ConferenceActions.updateActiveConferenceStatus({ conferenceId: conferenceTestData.id, status: updatedStatus })
            );

            expect(updatedResult.currentConference?.status).toBe(updatedStatus);
        });
    });
});
