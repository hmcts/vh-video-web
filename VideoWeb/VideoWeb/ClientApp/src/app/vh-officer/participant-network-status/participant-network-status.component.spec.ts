import { ParticipantStatus, ParticipantForUserResponse } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ParticipantNetworkStatusComponent } from './participant-network-status.component';
import { ParticipantSummary } from '../../shared/models/participant-summary';
import { ParticipantHeartbeat, HeartbeatHealth } from '../../services/models/participant-heartbeat';

describe('ParticipantNetworkStatusComponent', () => {

  const component = new ParticipantNetworkStatusComponent();

  it('should return "good signal" image', () => {
    const p = new ConferenceTestData().getConferenceFuture().participants.map(x => new ParticipantSummary(x))[0];
    p.status = ParticipantStatus.Available;
    p.participantHertBeatHealth = new ParticipantHeartbeat('1111-1111-1111-1111', '1111-1111-1111-1111', HeartbeatHealth.Good, 'Chrome', '80.0.3987.132');
    component.participant = p;
    expect(component.getParticipantNetworkStatus()).toBe('good-signal.png');
  });

  it('should return "bad signal" image', () => {
    const p = new ConferenceTestData().getConferenceFuture().participants.map(x => new ParticipantSummary(x))[0];
    p.status = ParticipantStatus.Available;
    p.participantHertBeatHealth = new ParticipantHeartbeat('1111-1111-1111-1111', '1111-1111-1111-1111', HeartbeatHealth.Bad, 'Chrome', '80.0.3987.132');
    component.participant = p;
    expect(component.getParticipantNetworkStatus()).toBe('bad-signal.png');
  });

  it('should return "poor signal" image', () => {
    const p = new ConferenceTestData().getConferenceFuture().participants.map(x => new ParticipantSummary(x))[0];
    p.status = ParticipantStatus.Available;
    p.participantHertBeatHealth = new ParticipantHeartbeat('1111-1111-1111-1111', '1111-1111-1111-1111', HeartbeatHealth.Poor, 'Chrome', '80.0.3987.132');
    component.participant = p;
    expect(component.getParticipantNetworkStatus()).toBe('poor-signal.png');
  });

  it('should return "not signed in" class', () => {
    const p = new ConferenceTestData().getConferenceFuture().participants.map(x => new ParticipantSummary(x))[0];
    p.participantHertBeatHealth = undefined;

    component.participant = p;

    expect(component.getParticipantNetworkStatus()).toBe('not-signed-in.png');

    p.status = ParticipantStatus.Disconnected;
    component.participant = p;
    expect(component.getParticipantNetworkStatus()).toBe('disconnected.png');
  });

  it('should return "disconnected" class', () => {
    const p = new ConferenceTestData().getConferenceFuture().participants.map(x => new ParticipantSummary(x))[0];
    p.participantHertBeatHealth = new ParticipantHeartbeat('1111-1111-1111-1111', '1111-1111-1111-1111', HeartbeatHealth.None, 'Chrome', '80.0.3987.132');
    p.status = ParticipantStatus.Disconnected;
    component.participant = p;

    expect(component.getParticipantNetworkStatus()).toBe('disconnected.png');
  });

  it('should return "non compatible browser" image', () => {
    const p = new ConferenceTestData().getConferenceFuture().participants.map(x => new ParticipantSummary(x))[0];
    p.participantHertBeatHealth = new ParticipantHeartbeat('1111-1111-1111-1111', '1111-1111-1111-1111', HeartbeatHealth.None, 'Safari', '13.0');
    component.participant = p;
    expect(component.getParticipantNetworkStatus()).toBe('incompatible-browser-signal.png');

    p.participantHertBeatHealth = new ParticipantHeartbeat('1111-1111-1111-1111', '1111-1111-1111-1111', HeartbeatHealth.None, 'Edge', '38.14393');
    component.participant = p;
    expect(component.getParticipantNetworkStatus()).toBe('incompatible-browser-signal.png');
  });
  it('should emit event with ParticipantSummary on the click', () => {
    const participant = new ParticipantSummary(new ParticipantForUserResponse({ id: '1111-2222-3333' }));
    component.participant = participant;
    spyOn(component.showMonitorGraph, 'emit');
    component.showParticipantGraph();
    expect(component.showMonitorGraph.emit).toHaveBeenCalled();
    expect(component.showMonitorGraph.emit).toHaveBeenCalledWith(participant);
  });
});
