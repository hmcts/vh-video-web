import { Guid } from 'guid-typescript';
import { Observable, Subject } from 'rxjs';
import { AdminConsultationMessage } from 'src/app/services/models/admin-consultation-message';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { ConsultationMessage } from 'src/app/services/models/consultation-message';
import { HelpMessage } from 'src/app/services/models/help-message';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { ChatResponse, ConferenceStatus, ConsultationAnswer, ParticipantStatus, RoomType } from '../../services/clients/api-client';
import { ParticipantHeartbeat } from '../../services/models/participant-heartbeat';

export class MockEventsService {
    nextParticipantStatusMessage: ParticipantStatusMessage;
    nextHearingStatusMessage: ConferenceStatusMessage;
    nextHelpMessage: HelpMessage;
    nextConsultationMessage: ConsultationMessage;
    nextAdminConsultationMessage: AdminConsultationMessage;
    nextChatMessageMessage: ChatResponse;
    nextAdminAnsweredChatMessage: string;
    nextJudgeStatusMessage: ParticipantStatusMessage;
    nextChatMessage: ChatResponse;
    nextHeartbeat: ParticipantHeartbeat;

    participantStatusSubject = new Subject<ParticipantStatusMessage>();
    hearingStatusSubject = new Subject<ConferenceStatusMessage>();
    helpMessageSubject = new Subject<HelpMessage>();
    consultationMessageSubject = new Subject<ConsultationMessage>();
    adminConsultationMessageSubject = new Subject<AdminConsultationMessage>();
    messageSubject = new Subject<InstantMessage>();
    participantHeartbeat = new Subject<ParticipantHeartbeat>();
    adminAnsweredChatSubject = new Subject<string>();
    eventHubDisconnectSubject = new Subject<number>();
    eventHubReconnectSubject = new Subject();

    constructor() {
        this.nextParticipantStatusMessage = new ParticipantStatusMessage(
            '9F681318-4955-49AF-A887-DED64554429D', 'username', '9F681318-4955-49AF-A887-DED64554429D',
            ParticipantStatus.Available
        );
        this.nextHearingStatusMessage = new ConferenceStatusMessage('612AB52C-BDA5-4F4D-95B8-3F49065219A6', ConferenceStatus.InSession);
        this.nextHelpMessage = new HelpMessage('612AB52C-BDA5-4F4D-95B8-3F49065219A6', 'chris.green@hearings.net');
        this.nextConsultationMessage = new ConsultationMessage(
            '612AB52C-BDA5-4F4D-95B8-3F49065219A6',
            'chris.green@hearings.net',
            'james.green@hearings.net',
            null
        );
        this.nextAdminConsultationMessage = new AdminConsultationMessage(
            '612AB52C-BDA5-4F4D-95B8-3F49065219A6',
            RoomType.ConsultationRoom1,
            'james.green@hearings.net',
            ConsultationAnswer.None
        );
        this.nextJudgeStatusMessage = new ParticipantStatusMessage('9F681318-4955-49AF-A887-DED64554429T', 'username',
          '9F681318-4955-49AF-A887-DED64554429D', ParticipantStatus.Disconnected);
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

    getConsultationMessage(): Observable<ConsultationMessage> {
        return this.consultationMessageSubject.asObservable();
    }

    getAdminConsultationMessage(): Observable<AdminConsultationMessage> {
        return this.adminConsultationMessageSubject.asObservable();
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

    getAdminAnsweredChat(): Observable<string> {
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
