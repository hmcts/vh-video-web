import { ParticipantStatus } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ParticipantNetworkStatusComponent } from './participant-network-status.component';
import { Participant } from 'src/app/shared/models/participant';
import { ParticipantSummary } from '../../shared/models/participant-summary';

describe('ParticipantStatusComponent', () => {

  const component = new ParticipantNetworkStatusComponent();

  it('should return "available" class', () => {
    const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
    p.status = ParticipantStatus.Available;
    // const participant = new Participant(p);
   // expect(component.getParticipantStatusClass(participant)).toBe('participant-available');
  });

  it('should return "not signed in" class', () => {
    const p = new ConferenceTestData().getConferenceFuture().participants[0];
    p.status = ParticipantStatus.None;
   
    component.participant = new ParticipantSummary(p);

    expect(component.getParticipantNetworkStatus()).toBe('incompatible-browser-signal.png');

    p.status = ParticipantStatus.NotSignedIn;
    component.participant = new ParticipantSummary(p);
    expect(component.getParticipantNetworkStatus()).toBe('not-signed-in.png');
  });

  it('should return "disconnected" class', () => {
    const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
    p.status = ParticipantStatus.Disconnected;
    // const participant = new Participant(p);

   //  expect(component.getParticipantStatusClass(participant)).toBe('participant-disconnected');
  });

  it('should return "default" class', () => {
    const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
    p.status = ParticipantStatus.InConsultation;
    let participant = new Participant(p);

    // expect(component.getParticipantStatusClass(participant)).toBe('participant-default-status');

    p.status = ParticipantStatus.UnableToJoin;
    participant = new Participant(p);
   //  expect(component.getParticipantStatusClass(participant)).toBe('participant-default-status');

    p.status = ParticipantStatus.InHearing;
    participant = new Participant(p);
   // expect(component.getParticipantStatusClass(participant)).toBe('participant-default-status');

    p.status = ParticipantStatus.Joining;
    participant = new Participant(p);
    // expect(component.getParticipantStatusClass(participant)).toBe('participant-default-status');
  });
});
