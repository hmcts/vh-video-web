import { ParticipantUpdated, ConferenceUpdated } from './video-call-models';

describe('ParticipantUpdated', () => {
    let participantUpdated: ParticipantUpdated;
    let conferenceUpdated: ConferenceUpdated;

    it('should return muted status', () => {
        participantUpdated = new ParticipantUpdated('YES', 1234);
        expect(participantUpdated.isMuted).toBeTruthy();
    });
    it('should return unmuted status', () => {
        participantUpdated = new ParticipantUpdated('NO', 1234);
        expect(participantUpdated.isMuted).toBeFalsy();
    });
    it('shuld return hand not raised', () => {
        participantUpdated = new ParticipantUpdated('YES', 1234);
        expect(participantUpdated.handRaised).toBeTruthy();
    });
    it('shuld return hand raised', () => {
        participantUpdated = new ParticipantUpdated('YES', 0);
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
