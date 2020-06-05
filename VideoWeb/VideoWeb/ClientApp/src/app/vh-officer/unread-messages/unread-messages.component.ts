import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { UnreadAdminMessageResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { Hearing } from '../../shared/models/hearing';
import { UnreadMessagesComponentBase } from '../unread-messages-shared/unread-message-base.component';

@Component({
    selector: 'app-unread-messages',
    templateUrl: '../unread-messages-shared/unread-messages.component.html',
    styleUrls: ['../unread-messages-shared/unread-messages.component.scss']
})
export class UnreadMessagesComponent extends UnreadMessagesComponentBase implements OnInit, OnDestroy {
    @Input() hearing: Hearing;

    messagesSubscription$: Subscription = new Subscription();
    unreadMessages: UnreadAdminMessageResponse[];

    constructor(private videoWebService: VideoWebService, protected eventsService: EventsService, protected logger: Logger) {
        super(eventsService, logger);
    }

    ngOnInit() {
        this.setupSubscribers();
        this.videoWebService
            .getUnreadMessageCountForConference(this.hearing.id)
            .then(response => (this.unreadMessages = response.number_of_unread_messages_conference))
            .catch(err => this.logger.error(`Failed to get unread vho messages for ${this.hearing.id}`, err));
    }

    get unreadCount(): number {
        if (!Array.isArray(this.unreadMessages) || this.unreadMessages.length < 1) {
            return 0;
        }
        const unreadTotal: number = this.unreadMessages.map(m => m.number_of_unread_messages).reduce((a, b) => a + b);
        return unreadTotal;
    }

    getHearing(): Hearing {
        return this.hearing;
    }

    resetUnreadCounter(conferenceId: string, participantUsername: string): void {
        if (this.hearing.id === conferenceId) {
            const messageCount = this.unreadMessages.find(x => x.participant_username.toLowerCase() === participantUsername.toLowerCase());
            messageCount.number_of_unread_messages = 0;
        }
    }

    incrementUnreadCounter(conferenceId: string, participantUsername: string): void {
        if (this.hearing.id === conferenceId) {
            const messageCount = this.unreadMessages.find(x => x.participant_username.toLowerCase() === participantUsername.toLowerCase());
            messageCount.number_of_unread_messages++;
        }
    }

    ngOnDestroy(): void {
        this.clearMessageSubscription();
    }
}
