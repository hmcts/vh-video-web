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

  it('should return first character of first name and full last name', () => {
    const p = new ConferenceTestData().getConferenceDetail().participants.find(x => x.name === 'Mr James Green');
    const participant = new Participant(p);
    expect(participant.initialedName).toBe('J Green');
  });

  it('should map participant info', () => {
    const p = new ConferenceTestData().getConferenceDetail().participants.find(x => x.name === 'Mr James Green');
    const participant = new Participant(p);
    expect(participant.id).toBe(p.id);
    expect(participant.fullName).toBe(p.name);
    expect(participant.caseGroup).toBe(p.case_type_group);
    expect(participant.contactEmail).toBe(p.contact_email);
    expect(participant.contactTelephone).toBe(p.contact_telephone);
    expect(participant.status).toBe(p.status);
    expect(participant.role).toBe(p.role);
  });
});
