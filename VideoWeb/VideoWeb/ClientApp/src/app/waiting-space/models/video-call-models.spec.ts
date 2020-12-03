import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { VideoCallTestData } from 'src/app/testing/mocks/data/video-call-test-data';
import { ConferenceUpdated, ParticipantUpdated } from './video-call-models';

describe('ParticipantUpdated', () => {
    const participantDisplayName = new ConferenceTestData().getConferenceDetailNow().participants[0].tiled_display_name;
    const testData = new VideoCallTestData();

    it('should return muted status', () => {
        const pexipParticipant = testData.getExamplePexipParticipant(participantDisplayName);
        pexipParticipant.is_muted = 'Yes';
        const participantUpdated = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        expect(participantUpdated.isRemoteMuted).toBeTruthy();
        expect(participantUpdated.pexipDisplayName).toBe(participantDisplayName);
    });
    it('should return unmuted status', () => {
        const pexipParticipant = testData.getExamplePexipParticipant(participantDisplayName);
        pexipParticipant.is_muted = 'NO';
        const participantUpdated = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        expect(participantUpdated.isRemoteMuted).toBeFalsy();
    });
    it('shuld return hand not raised', () => {
        const pexipParticipant = testData.getExamplePexipParticipant(participantDisplayName);
        pexipParticipant.buzz_time = 0;
        const participantUpdated = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        expect(participantUpdated.handRaised).toBeFalsy();
    });
    it('shuld return hand raised', () => {
        const pexipParticipant = testData.getExamplePexipParticipant(participantDisplayName);
        pexipParticipant.buzz_time = new Date().getTime();
        const participantUpdated = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        expect(participantUpdated.handRaised).toBeTruthy();
    });
    it('should create conference updated model for muted status', () => {
        const conferenceUpdated = new ConferenceUpdated(true);
        expect(conferenceUpdated).toBeTruthy();
    });
    it('should create conference updated model for unmuted status', () => {
        const conferenceUpdated = new ConferenceUpdated(false);
        expect(conferenceUpdated).toBeTruthy();
    });
    it('should return spotlighted true', () => {
        const pexipParticipant = testData.getExamplePexipParticipant(participantDisplayName);
        pexipParticipant.spotlight = new Date().getTime();
        const participantUpdated = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        expect(participantUpdated.isSpotlighted).toBeTruthy();
    });
    it('should return spotlighted false', () => {
        const pexipParticipant = testData.getExamplePexipParticipant(participantDisplayName);
        pexipParticipant.spotlight = 0;
        const participantUpdated = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        expect(participantUpdated.isSpotlighted).toBeFalsy();
    });

    it('should return is audio only call true', () => {
        const pexipParticipant = testData.getExamplePexipParticipant(participantDisplayName);
        pexipParticipant.is_audio_only_call = 'Yes';
        const participantUpdated = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        expect(participantUpdated.isSpotlighted).toBeFalsy();
    });

    it('should return is audio only call false', () => {
        const pexipParticipant = testData.getExamplePexipParticipant(participantDisplayName);
        pexipParticipant.is_audio_only_call = 'No';
        const participantUpdated = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        expect(participantUpdated.isSpotlighted).toBeFalsy();
    });

    it('should return is video call true', () => {
        const pexipParticipant = testData.getExamplePexipParticipant(participantDisplayName);
        pexipParticipant.is_video_call = 'Yes';
        const participantUpdated = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        expect(participantUpdated.isSpotlighted).toBeFalsy();
    });

    it('should return is video call false', () => {
        const pexipParticipant = testData.getExamplePexipParticipant(participantDisplayName);
        pexipParticipant.is_video_call = 'No';
        const participantUpdated = ParticipantUpdated.fromPexipParticipant(pexipParticipant);
        expect(participantUpdated.isSpotlighted).toBeFalsy();
    });
});
