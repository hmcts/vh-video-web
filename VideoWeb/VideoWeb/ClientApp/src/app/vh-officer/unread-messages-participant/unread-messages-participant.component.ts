import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { UnreadAdminMessageResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { Hearing } from 'src/app/shared/models/hearing';
import { Participant } from 'src/app/shared/models/participant';
import { UnreadMessagesComponentBase } from '../unread-messages-shared/unread-message-base.component';

@Component({
    selector: 'app-unread-messages-participant',
    templateUrl: '../unread-messages-shared/unread-messages.component.html',
    styleUrls: ['../unread-messages-shared/unread-messages.component.scss']
})
export class UnreadMessagesParticipantComponent extends UnreadMessagesComponentBase implements OnInit, OnDestroy {
    @Input() hearing: Hearing;
    @Input() participant: Participant;

    unreadMessages: UnreadAdminMessageResponse;

    constructor(
        private videoWebService: VideoWebService,
        protected eventsService: EventsService,
        protected logger: Logger
    ) {
        super(eventsService, logger);
    }

    get unreadCount(): number {
        if (!this.unreadMessages) {
            return 0;
        }
        return this.unreadMessages.number_of_unread_messages;
    }

    ngOnInit() {
        const payload = {
            conference: this.hearing.id,
            participant: this.participant.id
        };
        this.setupSubscribers();
        this.logger.debug('[UnreadMessagesParticipant] - Getting unread message count for participant', payload);
        this.videoWebService
            .getUnreadMessagesForParticipant(this.hearing.id, this.participant.id)
            .then(response => (this.unreadMessages = response))
            .catch(err =>
                this.logger.error(
                    `[UnreadMessagesParticipant] - Failed to get unread vho messages for participant ${this.hearing.id} and participant ${this.participant.id}`,
                    err,
                    payload
                )
            );
    }

    ngOnDestroy(): void {
        this.clearMessageSubscription();
    }

    getHearing(): Hearing {
        return this.hearing;
    }
    resetUnreadCounter(conferenceId: string, participantId: string): void {
        if (this.hearing.id === conferenceId && this.participant.id === participantId) {
            this.unreadMessages.number_of_unread_messages = 0;
        }
    }
    incrementUnreadCounter(conferenceId: string, participantId: string): void {
        if (this.hearing.id === conferenceId && this.participant.id === participantId) {
            this.unreadMessages.number_of_unread_messages++;
        }
    }

    handleImReceived(message: InstantMessage) {
        if (this.getHearing().id === message.conferenceId && this.messageFromParticipant(message)) {
            this.incrementUnreadCounter(message.conferenceId, message.from);
        }
    }

    openImChat() {
        this.logger.debug('[UnreadMessagesParticipant] - Open IM chat');
    }
}
