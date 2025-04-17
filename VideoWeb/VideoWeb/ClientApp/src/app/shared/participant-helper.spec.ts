import { Role } from '../services/clients/api-client';
import { ConferenceTestData } from '../testing/mocks/data/conference-test-data';
import { mapConferenceToVHConference } from '../waiting-space/store/models/api-contract-to-state-model-mappers';
import { VHConference } from '../waiting-space/store/models/vh-conference';
import { ParticipantHelper } from './participant-helper';

describe('ParticipantHelper', () => {
    function createConference(): VHConference {
        const conferenceResponse = new ConferenceTestData().getConferenceDetailNow();
        const conference = mapConferenceToVHConference(conferenceResponse);
        return conference;
    }

    describe('isStaffMember', () => {
        it('should be true if the user is a staff member', () => {
            const participant = createConference().participants[0];
            participant.role = Role.StaffMember;
            expect(ParticipantHelper.isStaffMember(participant)).toBeTrue();
        });

        it('should be false if the user is not a staff member', () => {
            const participant = createConference().participants[0];
            participant.role = Role.Individual;
            expect(ParticipantHelper.isStaffMember(participant)).toBeFalse();
        });
    });
});
