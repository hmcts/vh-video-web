import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';

@Component({
    selector: 'app-unread-messages',
    templateUrl: './unread-messages.component.html',
    styleUrls: ['./unread-messages.component.scss', '../vho-global-styles.scss']
})
export class UnreadMessagesComponent implements OnInit, OnDestroy {
    @Input() conferenceId: string;
    messagesSubscription$: Subscription = new Subscription();
    unreadCount: number;
    constructor(private videoWebService: VideoWebService, private eventsService: EventsService, private logger: Logger) {}

    ngOnInit() {
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
        this.eventsService.start();
    }

    resetConferenceUnreadCounter(conferenceId: string) {
        if (this.conferenceId === conferenceId) {
            this.unreadCount = 0;
        }
    }

    ngOnDestroy(): void {
        this.messagesSubscription$.unsubscribe();
    }
}
