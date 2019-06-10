import { ParticipantStatus } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ParticipantStatusComponent } from './participant-status.component';

describe('ParticipantStatusComponent', () => {

    const component = new ParticipantStatusComponent();

    it('should return "available" class', () => {
        const p = new ConferenceTestData().getConferenceDetail().participants[0];
        p.status = ParticipantStatus.Available;
        expect(component.getParticipantStatusClass(p)).toBe('participant-available');
    });

    it('should return "not signed in" class', () => {
        const p = new ConferenceTestData().getConferenceDetail().participants[0];
        p.status = ParticipantStatus.None;
        expect(component.getParticipantStatusClass(p)).toBe('participant-not-signed-in');

        p.status = ParticipantStatus.NotSignedIn;
        expect(component.getParticipantStatusClass(p)).toBe('participant-not-signed-in');
    });

    it('should return "disconnected" class', () => {
        const p = new ConferenceTestData().getConferenceDetail().participants[0];
        p.status = ParticipantStatus.Disconnected;
        expect(component.getParticipantStatusClass(p)).toBe('participant-disconnected');
    });

    it('should return "default" class', () => {
        const p = new ConferenceTestData().getConferenceDetail().participants[0];
        p.status = ParticipantStatus.InConsultation;
        expect(component.getParticipantStatusClass(p)).toBe('participant-default-status');

        p.status = ParticipantStatus.UnableToJoin;
        expect(component.getParticipantStatusClass(p)).toBe('participant-default-status');

        p.status = ParticipantStatus.InHearing;
        expect(component.getParticipantStatusClass(p)).toBe('participant-default-status');

        p.status = ParticipantStatus.Joining;
        expect(component.getParticipantStatusClass(p)).toBe('participant-default-status');
    });

    it('should return the participant status text', () => {
        const p = new ConferenceTestData().getConferenceDetail().participants[0];
        expect(component.getParticipantStatusText(p)).toBeTruthy();
    });
});
