import { ParticipantGraphInfo } from '../models/participant-graph-info';

describe('ParticipantGraphInfo', () => {
  const model = new ParticipantGraphInfo('name', 'None');
  it('should get text for status None as Not signed in ', () => {
    expect(model.getStatusAsText('None')).toBe('Not signed in');
  });
  it('should get text for status NotSignedIn as Not signed in ', () => {
    expect(model.getStatusAsText('NotSignedIn')).toBe('Not signed in');
  });
  it('should get text for status InConsultation as In consultation ', () => {
    expect(model.getStatusAsText('InConsultation')).toBe('In consultation');
  });
  it('should get text for status InHearing as In hearing ', () => {
    expect(model.getStatusAsText('InHearing')).toBe('In hearing');
  });
  it('should get text for status UnableToJoin as Unable to join ', () => {
    expect(model.getStatusAsText('UnableToJoin')).toBe('Unable to join');
  });
  it('should get text for status Disconnected as Disconnected ', () => {
    expect(model.getStatusAsText('Disconnected')).toBe('Disconnected');
  });
});
