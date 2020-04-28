import {ParticipantStatus} from 'src/app/services/clients/api-client';
import {ConferenceTestData} from 'src/app/testing/mocks/data/conference-test-data';
import {ParticipantStatusComponent} from './participant-status.component';
import {Participant} from 'src/app/shared/models/participant';
import {VideoWebService} from '../../services/api/video-web.service';
import {ErrorService} from '../../services/error.service';
import {MockLogger} from '../../testing/mocks/MockLogger';
import {EventsService} from '../../services/events.service';
import {ParticipantStatusReader} from '../../shared/models/participant-status-reader';

describe('ParticipantStatusComponent', () => {
  let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
  let errorServiceSpy: jasmine.SpyObj<ErrorService>;
  let eventsService: jasmine.SpyObj<EventsService>;
  let participantStatusReader: jasmine.SpyObj<ParticipantStatusReader>;

  videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
    'getActiveIndividualConference',
    'raiseSelfTestFailureEvent'
  ]);
  errorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', ['handleApiError']);
  eventsService = jasmine.createSpyObj<EventsService>('EventsService', [
    'start', 'getHearingStatusMessage', 'getParticipantStatusMessage', 'getServiceDisconnected',
    'getServiceReconnected', 'getAdminAnsweredChat', 'getHeartbeat'
  ]);
  participantStatusReader = jasmine.createSpyObj<ParticipantStatusReader>('ParticipantStatusReader', [
    'getStatusAsText', 'getStatusAsTextForJudge'
  ]);

  const component = new ParticipantStatusComponent(videoWebServiceSpy, errorServiceSpy, eventsService, new MockLogger(), participantStatusReader);

  it('should return "available" class', () => {
    const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
    p.status = ParticipantStatus.Available;
    const participant = new Participant(p);
    expect(component.getParticipantStatusClass(participant.status)).toBe('participant-available');
  });

  it('should return "not signed in" class', () => {
    const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
    p.status = ParticipantStatus.None;
    let participant = new Participant(p);

    expect(component.getParticipantStatusClass(participant.status)).toBe('participant-not-signed-in');

    p.status = ParticipantStatus.NotSignedIn;
    participant = new Participant(p);
    expect(component.getParticipantStatusClass(participant.status)).toBe('participant-not-signed-in');
  });

  it('should return "disconnected" class', () => {
    const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
    p.status = ParticipantStatus.Disconnected;
    const participant = new Participant(p);

    expect(component.getParticipantStatusClass(participant.status)).toBe('participant-disconnected');
  });

  it('should return "default" class', () => {
    const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
    p.status = ParticipantStatus.InConsultation;
    let participant = new Participant(p);

    expect(component.getParticipantStatusClass(participant.status)).toBe('participant-default-status');

    p.status = ParticipantStatus.UnableToJoin;
    participant = new Participant(p);
    expect(component.getParticipantStatusClass(participant.status)).toBe('participant-default-status');

    p.status = ParticipantStatus.InHearing;
    participant = new Participant(p);
    expect(component.getParticipantStatusClass(participant.status)).toBe('participant-default-status');

    p.status = ParticipantStatus.Joining;
    participant = new Participant(p);
    expect(component.getParticipantStatusClass(participant.status)).toBe('participant-default-status');
  });
  it('should set venue name', () => {
    component.hearingVenueName = 'venue';
    expect(component.hearingVenueName).toBe('venue');
  });
});
