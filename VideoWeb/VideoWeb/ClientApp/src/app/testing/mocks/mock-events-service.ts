import { Subject } from 'rxjs';
import { EventsService } from 'src/app/services/events.service';
import { AdminConsultationMessage } from 'src/app/services/models/admin-consultation-message';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { ConsultationMessage } from 'src/app/services/models/consultation-message';
import { EndpointStatusMessage } from 'src/app/services/models/EndpointStatusMessage';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { ParticipantHeartbeat } from 'src/app/services/models/participant-heartbeat';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';

export let eventsServiceSpy: jasmine.SpyObj<EventsService>;

export const hearingStatusSubjectMock = new Subject<ConferenceStatusMessage>();
export const participantStatusSubjectMock = new Subject<ParticipantStatusMessage>();
export const endpointStatusSubjectMock = new Subject<EndpointStatusMessage>();
export const hearingCountdownCompleteSubjectMock = new Subject<string>();
export const adminConsultationMessageSubjectMock = new Subject<AdminConsultationMessage>();
export const eventHubDisconnectSubjectMock = new Subject<number>();
export const eventHubReconnectSubjectMock = new Subject();
export const consultationMessageSubjectMock = new Subject<ConsultationMessage>();
export const messageSubjectMock = new Subject<InstantMessage>();
export const heartbeatSubjectMock = new Subject<ParticipantHeartbeat>();

eventsServiceSpy = jasmine.createSpyObj<EventsService>('EventsService', [
    'start',
    'getHearingStatusMessage',
    'getParticipantStatusMessage',
    'getEndpointStatusMessage',
    'getHearingCountdownCompleteMessage',
    'getAdminConsultationMessage',
    'getServiceDisconnected',
    'getServiceReconnected',
    'sendHeartbeat',
    'getConsultationMessage',
    'getChatMessage',
    'sendMessage',
    'getHeartbeat'
]);

eventsServiceSpy.getHearingStatusMessage.and.returnValue(hearingStatusSubjectMock.asObservable());
eventsServiceSpy.getParticipantStatusMessage.and.returnValue(participantStatusSubjectMock.asObservable());
eventsServiceSpy.getEndpointStatusMessage.and.returnValue(endpointStatusSubjectMock.asObservable());
eventsServiceSpy.getHearingCountdownCompleteMessage.and.returnValue(hearingCountdownCompleteSubjectMock.asObservable());
eventsServiceSpy.getAdminConsultationMessage.and.returnValue(adminConsultationMessageSubjectMock.asObservable());
eventsServiceSpy.getServiceDisconnected.and.returnValue(eventHubDisconnectSubjectMock.asObservable());
eventsServiceSpy.getServiceReconnected.and.returnValue(eventHubReconnectSubjectMock.asObservable());
eventsServiceSpy.getConsultationMessage.and.returnValue(consultationMessageSubjectMock.asObservable());
eventsServiceSpy.getChatMessage.and.returnValue(messageSubjectMock.asObservable());
eventsServiceSpy.getHeartbeat.and.returnValue(heartbeatSubjectMock.asObservable());
