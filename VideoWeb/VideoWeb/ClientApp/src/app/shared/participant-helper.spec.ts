import { Role } from '../services/clients/api-client';
import { ConferenceTestData } from '../testing/mocks/data/conference-test-data';
import { mapConferenceToVHConference } from '../waiting-space/store/models/api-contract-to-state-model-mappers';
import { VHConference, VHParticipant } from '../waiting-space/store/models/vh-conference';
import { ParticipantHelper } from './participant-helper';

describe('ParticipantHelper', () => {
    let participant: VHParticipant;

    function createConference(): VHConference {
        const conferenceResponse = new ConferenceTestData().getConferenceDetailNow();
        const conference = mapConferenceToVHConference(conferenceResponse);
        return conference;
    }

    beforeEach(() => {
        participant = createConference().participants[0];
    });

    describe('isStaffMember', () => {
        it('should be true if the user is a staff member', () => {
            participant.role = Role.StaffMember;
            expect(ParticipantHelper.isStaffMember(participant)).toBeTrue();
        });

        it('should be false if the user is not a staff member', () => {
            participant.role = Role.Individual;
            expect(ParticipantHelper.isStaffMember(participant)).toBeFalse();
        });
    });

    describe('isInJohRoom', () => {
        beforeEach(() => {
            participant.room = {
                label: 'Room1',
                locked: false
            };
        });

        it('should be true if the user is in a JOH room', () => {
            participant.room.label = 'JudgeJOH123';
            expect(ParticipantHelper.isInJohRoom(participant)).toBeTrue();
        });

        it('should be false if the user is not in a JOH room', () => {
            participant.room.label = 'JudgeRoom123';
            expect(ParticipantHelper.isInJohRoom(participant)).toBeFalse();
        });
    });

    describe('isHost', () => {
        it('should be true if the user is a judge', () => {
            participant.role = Role.Judge;
            expect(ParticipantHelper.isHost(participant)).toBeTrue();
        });

        it('should be true if the user is a staff member', () => {
            participant.role = Role.StaffMember;
            expect(ParticipantHelper.isHost(participant)).toBeTrue();
        });

        it('should be false if the user is not a judge or staff member', () => {
            participant.role = Role.Individual;
            expect(ParticipantHelper.isHost(participant)).toBeFalse();
        });
    });
});
