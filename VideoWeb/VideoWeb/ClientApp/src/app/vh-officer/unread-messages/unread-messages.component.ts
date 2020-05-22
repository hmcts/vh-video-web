import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { Hearing } from '../../shared/models/hearing';
import { InstantMessage } from '../../services/models/instant-message';

@Component({
    selector: 'app-unread-messages',
    templateUrl: './unread-messages.component.html',
    styleUrls: ['./unread-messages.component.scss']
})
export class UnreadMessagesComponent implements OnInit, OnDestroy {
    @Input() hearing: Hearing;

    messagesSubscription$: Subscription = new Subscription();
    unreadCount: number;
    conferenceId: string;
    constructor(private videoWebService: VideoWebService, private eventsService: EventsService, private logger: Logger) { }

    ngOnInit() {
        this.conferenceId = this.hearing.id;
        this.unreadCount = 0;
        this.setupSubscribers();
        this.videoWebService
            .getUnreadAdminMessageCountForConference(this.conferenceId)
            .then(response => (this.unreadCount = response.number_of_unread_messages))
            .catch(err => this.logger.error(`Failed to get unread vho messages for ${this.conferenceId}`, err));
    }

    setupSubscribers() {
        this.messagesSubscription$.add(
            this.eventsService.getAdminAnsweredChat().subscribe(message => {
                this.logger.info(`an admin has answered`);
                this.resetConferenceUnreadCounter(message);
            })
        );

        this.messagesSubscription$.add(
            this.eventsService.getChatMessage().subscribe(message => {
                this.logger.info(`an admin has message`);
                if (this.conferenceId === message.conferenceId && this.messageFromParticipant(message)) {
                    this.unreadCount++;
                }
            })
        );
        this.eventsService.start();
    }

    private messageFromParticipant(message: InstantMessage): boolean {
        return this.hearing.participants.map(p => p.username.toUpperCase()).includes(message.from.toUpperCase());
    }


    resetConferenceUnreadCounter(conferenceId: string) {
        if (this.conferenceId === conferenceId) {
            this.unreadCount = 0;
        }
    }

    ngOnDestroy(): void {
        this.messagesSubscription$.unsubscribe();
    }

    getIMStatus(): string {
        return this.unreadCount > 0 ? 'IM_icon.png' : 'IM-empty.png';
    }
}
