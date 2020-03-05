import { ParticipantStatus, UserRole } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ParticipantStatusComponent } from './participant-status.component';
import { Participant } from 'src/app/shared/models/participant';

describe('ParticipantStatusComponent', () => {

  const component = new ParticipantStatusComponent();

  it('should return "available" class', () => {
    const p = new ConferenceTestData().getConferenceDetail().participants[0];
    p.status = ParticipantStatus.Available;
    const participant = new Participant(p);
    expect(component.getParticipantStatusClass(participant)).toBe('participant-available');
  });

  it('should return "not signed in" class', () => {
    const p = new ConferenceTestData().getConferenceDetail().participants[0];
    p.status = ParticipantStatus.None;
    let participant = new Participant(p);

    expect(component.getParticipantStatusClass(participant)).toBe('participant-not-signed-in');

    p.status = ParticipantStatus.NotSignedIn;
    participant = new Participant(p);
    expect(component.getParticipantStatusClass(participant)).toBe('participant-not-signed-in');
  });

  it('should return "disconnected" class', () => {
    const p = new ConferenceTestData().getConferenceDetail().participants[0];
    p.status = ParticipantStatus.Disconnected;
    const participant = new Participant(p);

    expect(component.getParticipantStatusClass(participant)).toBe('participant-disconnected');
  });

  it('should return "default" class', () => {
    const p = new ConferenceTestData().getConferenceDetail().participants[0];
    p.status = ParticipantStatus.InConsultation;
    let participant = new Participant(p);

    expect(component.getParticipantStatusClass(participant)).toBe('participant-default-status');

    p.status = ParticipantStatus.UnableToJoin;
    participant = new Participant(p);
    expect(component.getParticipantStatusClass(participant)).toBe('participant-default-status');

    p.status = ParticipantStatus.InHearing;
    participant = new Participant(p);
    expect(component.getParticipantStatusClass(participant)).toBe('participant-default-status');

    p.status = ParticipantStatus.Joining;
    participant = new Participant(p);
    expect(component.getParticipantStatusClass(participant)).toBe('participant-default-status');
  });
});
