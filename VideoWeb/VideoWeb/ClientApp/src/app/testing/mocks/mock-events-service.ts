import { EventsService } from 'src/app/services/events.service';
import { Subject } from 'rxjs';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { AdminConsultationMessage } from 'src/app/services/models/admin-consultation-message';

export let eventsServiceSpy: jasmine.SpyObj<EventsService>;

export const hearingStatusSubjectMock = new Subject<ConferenceStatusMessage>();
export const participantStatusSubjectMock = new Subject<ParticipantStatusMessage>();
export const adminConsultationMessageSubjectMock = new Subject<AdminConsultationMessage>();
export const eventHubDisconnectSubjectMock = new Subject<number>();
export const eventHubReconnectSubjectMock = new Subject();

eventsServiceSpy = jasmine.createSpyObj<EventsService>('EventsService', [
    'start',
    'getHearingStatusMessage',
    'getParticipantStatusMessage',
    'getAdminConsultationMessage',
    'getServiceDisconnected',
    'getServiceReconnected',
    'sendHeartbeat'
]);

eventsServiceSpy.getHearingStatusMessage.and.returnValue(hearingStatusSubjectMock.asObservable());
eventsServiceSpy.getParticipantStatusMessage.and.returnValue(participantStatusSubjectMock.asObservable());
eventsServiceSpy.getAdminConsultationMessage.and.returnValue(adminConsultationMessageSubjectMock.asObservable());
eventsServiceSpy.getServiceDisconnected.and.returnValue(eventHubDisconnectSubjectMock.asObservable());
eventsServiceSpy.getServiceReconnected.and.returnValue(eventHubReconnectSubjectMock.asObservable());
