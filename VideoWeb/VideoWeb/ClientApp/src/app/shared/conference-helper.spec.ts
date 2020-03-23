import { ConferenceTestData } from '../testing/mocks/data/conference-test-data';
import { ConferenceHelper } from './conference-helper';
import { Guid } from 'guid-typescript';

describe('ConferenceHelper', () => {
    it('should return participant when participant does exist in an array of conferences', () => {
        const conferences = new ConferenceTestData().getTestData();
        const participant = conferences[0].participants[0];

        const result = ConferenceHelper.findParticipantInConferences(conferences, participant.id);
        expect(result).toBe(participant);
    });

    it('should return null when participant does not exist in an array of conferences', () => {
        const conferences = new ConferenceTestData().getTestData();
        const participantId = Guid.create().toString();

        const result = ConferenceHelper.findParticipantInConferences(conferences, participantId);
        expect(result).toBeNull();
    });
});
