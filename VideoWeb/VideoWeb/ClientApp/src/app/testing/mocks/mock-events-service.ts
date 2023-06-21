import { Subject } from 'rxjs';
import { EventsService } from 'src/app/services/events.service';
import { ConferenceMessageAnswered } from 'src/app/services/models/conference-message-answered';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { ConsultationRequestResponseMessage } from 'src/app/services/models/consultation-request-response-message';
import { EndpointStatusMessage } from 'src/app/services/models/EndpointStatusMessage';
import { HearingLayoutChanged } from 'src/app/services/models/hearing-layout-changed';
import { HearingTransfer } from 'src/app/services/models/hearing-transfer';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { ParticipantHeartbeat } from 'src/app/services/models/participant-heartbeat';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { RequestedConsultationMessage } from 'src/app/services/models/requested-consultation-message';
import { ParticipantHandRaisedMessage } from 'src/app/shared/models/participant-hand-raised-message';
import { ParticipantMediaStatusMessage } from 'src/app/shared/models/participant-media-status-message';
import { ParticipantRemoteMuteMessage } from 'src/app/shared/models/participant-remote-mute-message';
import { ParticipantsUpdatedMessage } from 'src/app/shared/models/participants-updated-message';
import { EndpointsUpdatedMessage } from 'src/app/shared/models/endpoints-updated-message';
import { Room } from '../../shared/models/room';
import { RoomTransfer } from '../../shared/models/room-transfer';
import { NewAllocationMessage } from '../../services/models/new-allocation-message';
import { ParticipantToggleLocalMuteMessage } from 'src/app/shared/models/participant-toggle-local-mute-message';

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
export const participantRemoteMuteStatusSubjectMock = new Subject<ParticipantRemoteMuteMessage>();
export const participantHandRaisedStatusSubjectMock = new Subject<ParticipantHandRaisedMessage>();
export const participantToggleLocalMuteSubjectMock = new Subject<ParticipantToggleLocalMuteMessage>();
export const roomUpdateSubjectMock = new Subject<Room>();
export const roomTransferSubjectMock = new Subject<RoomTransfer>();
export const adminAnsweredChatSubjectMock = new Subject<ConferenceMessageAnswered>();
export const onEventsHubReadySubjectMock = new Subject<boolean>();
export let eventHubIsConnectedMock: boolean;
export const getParticipantsUpdatedSubjectMock = new Subject<ParticipantsUpdatedMessage>();
export const hearingLayoutChangedSubjectMock = new Subject<HearingLayoutChanged>();
export const newAllocationMessageSubjectMock = new Subject<NewAllocationMessage>();
export const getEndpointsUpdatedMessageSubjectMock = new Subject<EndpointsUpdatedMessage>();

export const eventsServiceSpy = jasmine.createSpyObj<EventsService>(
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
        'getServiceConnected',
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
        'getAdminAnsweredChat',
        'getParticipantRemoteMuteStatusMessage',
        'getParticipantHandRaisedMessage',
        'getParticipantToggleLocalMuteMessage',
        'publishParticipantHandRaisedStatus',
        'publishRemoteMuteStatus',
        'onEventsHubReady',
        'getParticipantsUpdated',
        'getEndpointsUpdated',
        'getHearingLayoutChanged',
        'getAllocationMessage',
        'updateParticipantLocalMuteStatus',
        'updateAllParticipantLocalMuteStatus'
    ],
    ['eventHubIsConnected']
);

eventsServiceSpy.getHearingStatusMessage.and.returnValue(hearingStatusSubjectMock.asObservable());
eventsServiceSpy.getParticipantStatusMessage.and.returnValue(participantStatusSubjectMock.asObservable());
eventsServiceSpy.getEndpointStatusMessage.and.returnValue(endpointStatusSubjectMock.asObservable());
eventsServiceSpy.getHearingCountdownCompleteMessage.and.returnValue(hearingCountdownCompleteSubjectMock.asObservable());
eventsServiceSpy.getConsultationRequestResponseMessage.and.returnValue(consultationRequestResponseMessageSubjectMock.asObservable());
eventsServiceSpy.getServiceDisconnected.and.returnValue(eventHubDisconnectSubjectMock.asObservable());
eventsServiceSpy.getServiceConnected.and.returnValue(eventHubReconnectSubjectMock.asObservable());
eventsServiceSpy.getRequestedConsultationMessage.and.returnValue(requestedConsultationMessageSubjectMock.asObservable());
eventsServiceSpy.getChatMessage.and.returnValue(messageSubjectMock.asObservable());
eventsServiceSpy.getHeartbeat.and.returnValue(heartbeatSubjectMock.asObservable());
eventsServiceSpy.getHearingTransfer.and.returnValue(hearingTransferSubjectMock.asObservable());
eventsServiceSpy.getParticipantMediaStatusMessage.and.returnValue(participantMediaStatusSubjectMock.asObservable());
eventsServiceSpy.getParticipantRemoteMuteStatusMessage.and.returnValue(participantRemoteMuteStatusSubjectMock.asObservable());
eventsServiceSpy.getParticipantHandRaisedMessage.and.returnValue(participantHandRaisedStatusSubjectMock.asObservable());
eventsServiceSpy.getRoomUpdate.and.returnValue(roomUpdateSubjectMock.asObservable());
eventsServiceSpy.getRoomTransfer.and.returnValue(roomTransferSubjectMock.asObservable());
eventsServiceSpy.getAdminAnsweredChat.and.returnValue(adminAnsweredChatSubjectMock.asObservable());
eventsServiceSpy.onEventsHubReady.and.returnValue(onEventsHubReadySubjectMock.asObservable());
eventsServiceSpy.getParticipantsUpdated.and.returnValue(getParticipantsUpdatedSubjectMock.asObservable());
eventsServiceSpy.getHearingLayoutChanged.and.returnValue(hearingLayoutChangedSubjectMock.asObservable());
eventsServiceSpy.getAllocationMessage.and.returnValue(newAllocationMessageSubjectMock.asObservable());
eventsServiceSpy.getEndpointsUpdated.and.returnValue(getEndpointsUpdatedMessageSubjectMock.asObservable());
eventsServiceSpy.getParticipantToggleLocalMuteMessage.and.returnValue(participantToggleLocalMuteSubjectMock.asObservable());
