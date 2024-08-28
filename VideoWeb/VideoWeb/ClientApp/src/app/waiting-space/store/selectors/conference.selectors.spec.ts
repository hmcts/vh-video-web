import { VHConference, VHRoom } from '../models/vh-conference';
import { ConferenceState, initialState } from '../reducers/conference.reducer';
import { getActiveConference, getEndpoints, getParticipants } from './conference.selectors';
import { ConferenceStatus, EndpointStatus, ParticipantStatus, Role, Supplier } from 'src/app/services/clients/api-client';
import { HearingRole } from '../../models/hearing-role-model';

describe('Conference Selectors', () => {
    let conferenceTestData: VHConference;
    let existingInitialState: ConferenceState;

    beforeEach(() => {
        const originalRoom: VHRoom = {
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
            isVenueScottish: false,
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
            ],
            supplier: Supplier.Vodafone
        };
        existingInitialState = {
            currentConference: conferenceTestData,
            availableRooms: [originalRoom]
        };
    });

    it('should select the feature state', () => {
        expect(getActiveConference({ 'active-conference': existingInitialState })).toEqual(conferenceTestData);
    });

    it('should select the feature state with no conference', () => {
        expect(getActiveConference({ 'active-conference': initialState })).toBeUndefined();
    });

    it('should get the participants', () => {
        expect(getParticipants({ 'active-conference': existingInitialState })).toEqual(conferenceTestData.participants);
    });

    it('should get the participants with no conference', () => {
        expect(getParticipants({ 'active-conference': initialState })).toBeUndefined();
    });

    it('should get the endpoints', () => {
        expect(getEndpoints({ 'active-conference': existingInitialState })).toEqual(conferenceTestData.endpoints);
    });

    it('should get the endpoints with no conference', () => {
        expect(getEndpoints({ 'active-conference': initialState })).toBeUndefined();
    });
});
