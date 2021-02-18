import { Subject } from 'rxjs';
import { EventsService } from 'src/app/services/events.service';
import { ConsultationRequestResponseMessage } from 'src/app/services/models/consultation-request-response-message';
import { ConferenceMessageAnswered } from 'src/app/services/models/conference-message-answered';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { RequestedConsultationMessage } from 'src/app/services/models/requested-consultation-message';
import { EndpointStatusMessage } from 'src/app/services/models/EndpointStatusMessage';
import { HearingTransfer } from 'src/app/services/models/hearing-transfer';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { ParticipantHeartbeat } from 'src/app/services/models/participant-heartbeat';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { ParticipantMediaStatusMessage } from 'src/app/shared/models/participant-media-status-message';
import { Room } from '../../shared/models/room';
import { RoomTransfer } from '../../shared/models/room-transfer';

export let eventsServiceSpy: jasmine.SpyObj<EventsService>;

export const hearingStatusSubjectMock = new Subject<ConferenceStatusMessage>();
export const participantStatusSubjectMock = new Subject<ParticipantStatusMessage>();
export const endpointStatusSubjectMock = new Subject<EndpointStatusMessage>();
export const hearingCountdownCompleteSubjectMock = new Subject<string>();
export const consultationRequestResponseMessageSubjectMock = new Subject<ConsultationRequestResponseMessage>();
export const eventHubDisconnectSubjectMock = new Subject<number>();
export const eventHubReconnectSubjectMock = new Subject();
export const requestedConsultationMessageSubjectMock = new Subject<RequestedConsultationMessage>();
export const messageSubjectMock = new Subject<InstantMessage>();
export const heartbeatSubjectMock = new Subject<ParticipantHeartbeat>();
export const hearingTransferSubjectMock = new Subject<HearingTransfer>();
export const participantMediaStatusSubjectMock = new Subject<ParticipantMediaStatusMessage>();
export const roomUpdateSubjectMock = new Subject<Room>();
export const roomTransferSubjectMock = new Subject<RoomTransfer>();
export const adminAnsweredChatSubjectMock = new Subject<ConferenceMessageAnswered>();
export let isConnectedSpy = true;

eventsServiceSpy = jasmine.createSpyObj<EventsService>(
    'EventsService',
    [
        'start',
        'stop',
        'getHearingStatusMessage',
        'getParticipantStatusMessage',
        'getEndpointStatusMessage',
        'getHearingCountdownCompleteMessage',
        'getConsultationRequestResponseMessage',
        'getServiceDisconnected',
        'getServiceReconnected',
        'sendHeartbeat',
        'getRequestedConsultationMessage',
        'getChatMessage',
        'sendMessage',
        'getHeartbeat',
        'getHearingTransfer',
        'sendTransferRequest',
        'getParticipantMediaStatusMessage',
        'sendMediaStatus',
        'getRoomUpdate',
        'getRoomTransfer',
        'getAdminAnsweredChat'
    ],
    {
        isConnectedToHub: isConnectedSpy
    }
);

eventsServiceSpy.getHearingStatusMessage.and.returnValue(hearingStatusSubjectMock.asObservable());
eventsServiceSpy.getParticipantStatusMessage.and.returnValue(participantStatusSubjectMock.asObservable());
eventsServiceSpy.getEndpointStatusMessage.and.returnValue(endpointStatusSubjectMock.asObservable());
eventsServiceSpy.getHearingCountdownCompleteMessage.and.returnValue(hearingCountdownCompleteSubjectMock.asObservable());
eventsServiceSpy.getConsultationRequestResponseMessage.and.returnValue(consultationRequestResponseMessageSubjectMock.asObservable());
eventsServiceSpy.getServiceDisconnected.and.returnValue(eventHubDisconnectSubjectMock.asObservable());
eventsServiceSpy.getServiceReconnected.and.returnValue(eventHubReconnectSubjectMock.asObservable());
eventsServiceSpy.getRequestedConsultationMessage.and.returnValue(requestedConsultationMessageSubjectMock.asObservable());
eventsServiceSpy.getChatMessage.and.returnValue(messageSubjectMock.asObservable());
eventsServiceSpy.getHeartbeat.and.returnValue(heartbeatSubjectMock.asObservable());
eventsServiceSpy.getHearingTransfer.and.returnValue(hearingTransferSubjectMock.asObservable());
eventsServiceSpy.getParticipantMediaStatusMessage.and.returnValue(participantMediaStatusSubjectMock.asObservable());
eventsServiceSpy.getRoomUpdate.and.returnValue(roomUpdateSubjectMock.asObservable());
eventsServiceSpy.getRoomTransfer.and.returnValue(roomTransferSubjectMock.asObservable());
eventsServiceSpy.getAdminAnsweredChat.and.returnValue(adminAnsweredChatSubjectMock.asObservable());
