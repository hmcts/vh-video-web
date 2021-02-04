import { Guid } from 'guid-typescript';
import { Observable, Subject } from 'rxjs';
import { ConsultationRequestResponseMessage } from 'src/app/services/models/consultation-request-response-message';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { RequestedConsultationMessage } from 'src/app/services/models/requested-consultation-message';
import { HelpMessage } from 'src/app/services/models/help-message';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { ChatResponse, ConferenceStatus, ConsultationAnswer, ParticipantStatus } from '../../services/clients/api-client';
import { ParticipantHeartbeat } from '../../services/models/participant-heartbeat';
import { ConferenceMessageAnswered } from 'src/app/services/models/conference-message-answered';

export class MockEventsService {
    nextParticipantStatusMessage: ParticipantStatusMessage;
    nextHearingStatusMessage: ConferenceStatusMessage;
    nextHelpMessage: HelpMessage;
    nextRequestedConsultationMessage: RequestedConsultationMessage;
    nextConsultationRequestResponseMessage: ConsultationRequestResponseMessage;
    nextChatMessageMessage: ChatResponse;
    nextAdminAnsweredChatMessage: string;
    nextJudgeStatusMessage: ParticipantStatusMessage;
    nextChatMessage: ChatResponse;
    nextHeartbeat: ParticipantHeartbeat;

    participantStatusSubject = new Subject<ParticipantStatusMessage>();
    hearingStatusSubject = new Subject<ConferenceStatusMessage>();
    helpMessageSubject = new Subject<HelpMessage>();
    requestedConsultationMessageSubject = new Subject<RequestedConsultationMessage>();
    consultationRequestResponseMessageSubject = new Subject<ConsultationRequestResponseMessage>();
    messageSubject = new Subject<InstantMessage>();
    participantHeartbeat = new Subject<ParticipantHeartbeat>();
    adminAnsweredChatSubject = new Subject<ConferenceMessageAnswered>();
    eventHubDisconnectSubject = new Subject<number>();
    eventHubReconnectSubject = new Subject();

    constructor() {
        this.nextParticipantStatusMessage = new ParticipantStatusMessage(
            '9F681318-4955-49AF-A887-DED64554429D',
            'username',
            '9F681318-4955-49AF-A887-DED64554429D',
            ParticipantStatus.Available
        );
        this.nextHearingStatusMessage = new ConferenceStatusMessage('612AB52C-BDA5-4F4D-95B8-3F49065219A6', ConferenceStatus.InSession);
        this.nextHelpMessage = new HelpMessage('612AB52C-BDA5-4F4D-95B8-3F49065219A6', 'chris.green@hearings.net');
        this.nextRequestedConsultationMessage = new RequestedConsultationMessage(
            '612AB52C-BDA5-4F4D-95B8-3F49065219A6',
            'chris.green@hearings.net',
            'james.green@hearings.net',
            'Room1'
        );
        this.nextConsultationRequestResponseMessage = new ConsultationRequestResponseMessage(
            '612AB52C-BDA5-4F4D-95B8-3F49065219A6',
            'ConsultationRoom',
            'james.green@hearings.net',
            ConsultationAnswer.None
        );
        this.nextJudgeStatusMessage = new ParticipantStatusMessage(
            '9F681318-4955-49AF-A887-DED64554429T',
            'username',
            '9F681318-4955-49AF-A887-DED64554429D',
            ParticipantStatus.Disconnected
        );
        this.nextChatMessage = new ChatResponse({
            id: Guid.create().toString(),
            from: 'judge.fudge@hearings.net',
            message: 'test message',
            timestamp: new Date()
        });
    }

    start() {}
    stop() {}

    getParticipantStatusMessage(): Observable<ParticipantStatusMessage> {
        return this.participantStatusSubject.asObservable();
    }

    getHearingStatusMessage(): Observable<ConferenceStatusMessage> {
        return this.hearingStatusSubject.asObservable();
    }

    getHelpMessage(): Observable<HelpMessage> {
        return this.helpMessageSubject.asObservable();
    }

    getConsultationMessage(): Observable<RequestedConsultationMessage> {
        return this.requestedConsultationMessageSubject.asObservable();
    }

    getConsultationRequestResponseMessage(): Observable<ConsultationRequestResponseMessage> {
        return this.consultationRequestResponseMessageSubject.asObservable();
    }

    getChatMessage(): Observable<ChatResponse> {
        return this.messageSubject.asObservable();
    }

    getServiceDisconnected(): Observable<any> {
        return this.eventHubDisconnectSubject.asObservable();
    }

    getServiceReconnected(): Observable<any> {
        return this.eventHubReconnectSubject.asObservable();
    }

    sendMessage(conferenceId: string, message: string) {}

    getAdminAnsweredChat(): Observable<ConferenceMessageAnswered> {
        return this.adminAnsweredChatSubject.asObservable();
    }

    getHeartbeat(): Observable<ParticipantHeartbeat> {
        return this.participantHeartbeat.asObservable();
    }
}

export class MockEventsNonHttpService {
    constructor() {}
    start() {}
    stop() {}
}
