import { ParticipantUpdated, ConferenceUpdated } from './video-call-models';

describe('ParticipantUpdated', () => {
    let participantUpdated: ParticipantUpdated;
    let conferenceUpdated: ConferenceUpdated;

    it('should return muted status', () => {
        participantUpdated = new ParticipantUpdated('YES');
        expect(participantUpdated.isMuted).toBeTruthy();
    });
    it('should return unmuted status', () => {
        participantUpdated = new ParticipantUpdated('NO');
        expect(participantUpdated.isMuted).toBeFalsy();
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
