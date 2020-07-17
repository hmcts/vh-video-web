import { EventsService } from 'src/app/services/events.service';
import { Subject } from 'rxjs';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { AdminConsultationMessage } from 'src/app/services/models/admin-consultation-message';
import { ConsultationMessage } from 'src/app/services/models/consultation-message';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { ParticipantHeartbeat } from 'src/app/services/models/participant-heartbeat';

export let eventsServiceSpy: jasmine.SpyObj<EventsService>;

export const hearingStatusSubjectMock = new Subject<ConferenceStatusMessage>();
export const participantStatusSubjectMock = new Subject<ParticipantStatusMessage>();
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
eventsServiceSpy.getAdminConsultationMessage.and.returnValue(adminConsultationMessageSubjectMock.asObservable());
eventsServiceSpy.getServiceDisconnected.and.returnValue(eventHubDisconnectSubjectMock.asObservable());
eventsServiceSpy.getServiceReconnected.and.returnValue(eventHubReconnectSubjectMock.asObservable());
eventsServiceSpy.getConsultationMessage.and.returnValue(consultationMessageSubjectMock.asObservable());
eventsServiceSpy.getChatMessage.and.returnValue(messageSubjectMock.asObservable());
eventsServiceSpy.getHeartbeat.and.returnValue(heartbeatSubjectMock.asObservable());
