import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { UnreadAdminMessageResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { Hearing } from '../../shared/models/hearing';
import { UnreadMessagesComponentBase } from '../unread-messages-shared/unread-message-base.component';
import { CommandCentreMenuService } from 'src/app/services/command-centre-menu.service';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { UnreadAdminMessageModelMapper } from 'src/app/shared/mappers/unread-messages-model-mapper';
import { UnreadAdminMessageModel } from 'src/app/waiting-space/models/unread-admin-message-model';

@Component({
    standalone: false,
    selector: 'app-unread-messages',
    templateUrl: '../unread-messages-shared/unread-messages.component.html',
    styleUrls: ['../unread-messages-shared/unread-messages.component.scss']
})
export class UnreadMessagesComponent extends UnreadMessagesComponentBase implements OnInit, OnDestroy {
    @Input() hearing: Hearing;

    messagesSubscription$: Subscription = new Subscription();
    unreadMessages: UnreadAdminMessageModel[] = [];

    constructor(
        private videoWebService: VideoWebService,
        protected eventsService: EventsService,
        protected logger: Logger,
        private commandCentreMenuService: CommandCentreMenuService,
        private mapper: UnreadAdminMessageModelMapper
    ) {
        super(eventsService, logger);
    }

    get unreadCount(): number {
        if (!Array.isArray(this.unreadMessages) || this.unreadMessages.length < 1) {
            return 0;
        }
        const unreadTotalList: UnreadAdminMessageModel[] = this.unreadMessages.filter(i => i.conferenceId === this.hearing.id);

        let unreadTotal = 0;

        if (unreadTotalList.length > 0) {
            unreadTotal = unreadTotalList.map(m => m.number_of_unread_messages).reduce((a, b) => a + b, 0);
        }
        return unreadTotal;
    }

    ngOnInit() {
        this.setupSubscribers();
        this.logger.debug('[UnreadMessages] - Getting unread message count for conference', { conference: this.hearing.id });
        this.videoWebService
            .getUnreadMessageCountForConference(this.hearing.id)
            .then(response => {
                this.unreadMessages = this.mapper.mapUnreadMessageResponseArray(
                    response.number_of_unread_messages_conference,
                    this.hearing.id
                );
            })
            .catch(err => this.logger.error(`[UnreadMessages] - Failed to get unread vho messages for ${this.hearing.id}`, err));
    }

    getHearing(): Hearing {
        return this.hearing;
    }

    resetUnreadCounter(conferenceId: string, participantId: string): void {
        if (this.hearing.id === conferenceId) {
            const messageCount = this.unreadMessages.find(x => x.participant_id === participantId);
            if (messageCount) {
                messageCount.number_of_unread_messages = 0;
            }
        }
    }

    incrementUnreadCounter(conferenceId: string, participantId: string): void {
        if (this.hearing.id === conferenceId) {
            const messageCount = this.unreadMessages.find(x => x.participant_id === participantId);
            if (messageCount) {
                messageCount.number_of_unread_messages++;
            } else {
                const patFromHearing = this.hearing.participants.find(x => x.id === participantId);
                if (!patFromHearing) {
                    return;
                }
                this.unreadMessages.push(
                    new UnreadAdminMessageModel(
                        new UnreadAdminMessageResponse({
                            number_of_unread_messages: 1,
                            participant_id: participantId
                        }),
                        conferenceId
                    )
                );
            }
        }
    }

    handleImReceived(message: InstantMessage) {
        if (this.getHearing().id === message.conferenceId) {
            this.incrementUnreadCounter(message.conferenceId, message.from);
        }
    }

    openImChat() {
        this.commandCentreMenuService.emitConferenceImClicked();
    }

    ngOnDestroy(): void {
        this.clearMessageSubscription();
    }
}
