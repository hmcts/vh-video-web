import { ConferenceTestData } from '../testing/mocks/data/conference-test-data';
import { ConferenceHelper } from './conference-helper';
import { Guid } from 'guid-typescript';
import { HearingSummary } from './models/hearing-summary';

describe('ConferenceHelper', () => {
    it('should return participant when participant does exist in an array of conferences', () => {
        const conferences = new ConferenceTestData().getTestData().map(c => new HearingSummary(c));
        const conference = conferences[0];
        const participant = conference.getParticipants()[0];

        const result = ConferenceHelper.findParticipantInHearings(conferences, conference.id, participant.id);
        expect(result).toBe(participant);
    });

    it('should return null when participant does not exist in an array of conferences', () => {
        const conferences = new ConferenceTestData().getTestData().map(c => new HearingSummary(c));
        const conference = conferences[0];
        const participantId = Guid.create().toString();

        const result = ConferenceHelper.findParticipantInHearings(conferences, conference.id, participantId);
        expect(result).toBeUndefined();
    });
});
