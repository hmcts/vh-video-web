import { ParticipantUpdated, ConferenceUpdated } from './video-call-models';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';

describe('ParticipantUpdated', () => {
    const participantDisplayName = new ConferenceTestData().getConferenceDetailNow().participants[0].tiled_display_name;
    let participantUpdated: ParticipantUpdated;
    let conferenceUpdated: ConferenceUpdated;

    it('should return muted status', () => {
        participantUpdated = new ParticipantUpdated('YES', 1234, participantDisplayName);
        expect(participantUpdated.isMuted).toBeTruthy();
        expect(participantUpdated.pexipDisplayName).toBe(participantDisplayName);
    });
    it('should return unmuted status', () => {
        participantUpdated = new ParticipantUpdated('NO', 1234, participantDisplayName);
        expect(participantUpdated.isMuted).toBeFalsy();
    });
    it('shuld return hand not raised', () => {
        participantUpdated = new ParticipantUpdated('YES', 1234, participantDisplayName);
        expect(participantUpdated.handRaised).toBeTruthy();
    });
    it('shuld return hand raised', () => {
        participantUpdated = new ParticipantUpdated('YES', 0, participantDisplayName);
        expect(participantUpdated.handRaised).toBeFalsy();
    });
    it('should create conference updated model for muted status', () => {
        conferenceUpdated = new ConferenceUpdated(true);
        expect(conferenceUpdated).toBeTruthy();
    });
    it('should create conference updated model for unmuted status', () => {
        conferenceUpdated = new ConferenceUpdated(false);
        expect(conferenceUpdated).toBeTruthy();
    });
});
