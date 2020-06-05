import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { UnreadAdminMessageResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
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

    constructor(private videoWebService: VideoWebService, protected eventsService: EventsService, protected logger: Logger) {
        super(eventsService, logger);
    }

    ngOnInit() {
        this.setupSubscribers();
        this.videoWebService
            .getUnreadMessagesForParticipant(this.hearing.id, this.participant.username)
            .then(response => (this.unreadMessages = response))
            .catch(err =>
                this.logger.error(`Failed to get unread vho messages for ${this.hearing.id} and participant ${this.participant.id}`, err)
            );
    }

    ngOnDestroy(): void {
        this.clearMessageSubscription();
    }

    get unreadCount(): number {
        return this.unreadMessages.number_of_unread_messages;
    }
    getHearing(): Hearing {
        return this.hearing;
    }
    resetUnreadCounter(conferenceId: string, participantUsername: string): void {
        if (this.hearing.id === conferenceId && this.participant.username.toLowerCase() === participantUsername.toLowerCase()) {
            this.unreadMessages.number_of_unread_messages = 0;
        }
    }
    incrementUnreadCounter(conferenceId: string, participantUsername: string): void {
        if (this.hearing.id === conferenceId && this.participant.username.toLowerCase() === participantUsername.toLowerCase()) {
            this.unreadMessages.number_of_unread_messages++;
        }
    }
}
