import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { Participant } from './participant';
import { ParticipantStatus } from 'src/app/services/clients/api-client';

describe('Participant', () => {
  it('should return `not signed in` when with default status', () => {
    const p = new ConferenceTestData().getConferenceDetail().participants[0];
    p.status = ParticipantStatus.None;
    const participant = new Participant(p);
    expect(participant.getStatusAsText()).toBe('Not Signed In');
  });

  it('should return `not signed in`', () => {
    const p = new ConferenceTestData().getConferenceDetail().participants[0];
    p.status = ParticipantStatus.NotSignedIn;
    const participant = new Participant(p);
    expect(participant.getStatusAsText()).toBe('Not Signed In');
  });

  it('should return `not signed in`', () => {
    const p = new ConferenceTestData().getConferenceDetail().participants[0];
    p.status = ParticipantStatus.NotSignedIn;
    const participant = new Participant(p);
    expect(participant.getStatusAsText()).toBe('Not Signed In');
  });

  it('should return `In Consulation`', () => {
    const p = new ConferenceTestData().getConferenceDetail().participants[0];
    p.status = ParticipantStatus.InConsultation;
    const participant = new Participant(p);
    expect(participant.getStatusAsText()).toBe('In Consultation');
  });

  it('should return `In Hearing`', () => {
    const p = new ConferenceTestData().getConferenceDetail().participants[0];
    p.status = ParticipantStatus.InHearing;
    const participant = new Participant(p);
    expect(participant.getStatusAsText()).toBe('In Hearing');
  });

  it('should return `Unable to Join`', () => {
    const p = new ConferenceTestData().getConferenceDetail().participants[0];
    p.status = ParticipantStatus.UnableToJoin;
    const participant = new Participant(p);
    expect(participant.getStatusAsText()).toBe('Unable to Join');
  });

  it('should return status', () => {
    const p = new ConferenceTestData().getConferenceDetail().participants[0];
    p.status = ParticipantStatus.Available;
    const participant = new Participant(p);
    expect(participant.getStatusAsText()).toBe(ParticipantStatus.Available);
  });
});
