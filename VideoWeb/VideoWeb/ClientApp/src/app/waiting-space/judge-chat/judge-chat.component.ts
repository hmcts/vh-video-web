import { AfterViewChecked, Component, HostListener, OnDestroy, OnInit, Input } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { Subscription } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ChatResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ChatBaseComponent } from 'src/app/shared/chat/chat-base.component';
import { Hearing } from 'src/app/shared/models/hearing';
import { ImHelper } from 'src/app/shared/im-helper';
import { InstantMessage } from 'src/app/services/models/instant-message';

@Component({
    selector: 'app-judge-chat',
    templateUrl: './judge-chat.component.html',
    styleUrls: ['./judge-chat.component.scss']
})
export class JudgeChatComponent extends ChatBaseComponent implements OnInit, OnDestroy, AfterViewChecked {
    private chatHubSubscription: Subscription;

    showChat: boolean;
    unreadMessageCount: number;
    loading: boolean;

    lastAdminUsername: string;

    @Input() hearing: Hearing;

    constructor(
        protected videoWebService: VideoWebService,
        protected profileService: ProfileService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected adalService: AdalService,
        protected imHelper: ImHelper
    ) {
        super(videoWebService, profileService, eventService, logger, adalService, imHelper);
    }

    ngOnInit() {
        this.logger.debug(`[ChatHub Judge] starting chat for ${this.hearing.id}`);
        this.showChat = false;
        this.unreadMessageCount = 0;
        this.loading = true;
        this.setupChatSubscription().then(sub => (this.chatHubSubscription = sub));
        this.retrieveChatForConference().then(messages => {
            this.unreadMessageCount = this.getCountSinceUsersLastMessage(messages);
            this.loading = false;
            this.messages = messages;
        });
    }

    ngAfterViewChecked(): void {
        if (this.showChat) {
            this.resetUnreadMessageCount();
        }
    }

    async sendMessage(messageBody: string) {
        const toUser = this.lastAdminUsername ? this.lastAdminUsername : this.DEFAULT_ADMIN_USERNAME;
        await this.eventService.sendMessage(this.hearing.id, messageBody, toUser);
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        this.logger.debug(`[ChatHub Judge] closing chat for ${this.hearing.id}`);
        if (this.chatHubSubscription) {
            this.chatHubSubscription.unsubscribe();
        }
    }

    toggleChatDisplay() {
        this.showChat = !this.showChat;
    }

    handleIncomingOtherMessage(message: InstantMessage) {
        if (!this.showChat) {
            this.unreadMessageCount++;
        }

        if (!message.is_user) {
            // if message not from user (i.e. judge) then sent from admin
            this.lastAdminUsername = message.from;
        }
    }

    resetUnreadMessageCount() {
        this.unreadMessageCount = 0;
    }

    getCountSinceUsersLastMessage(messages: ChatResponse[]) {
        const reversedMessages = Object.assign([], messages);
        reversedMessages.sort((a: ChatResponse, b: ChatResponse) => {
            return b.timestamp.getTime() - a.timestamp.getTime();
        });
        const index = reversedMessages.findIndex(x => x.is_user);
        if (index < 0) {
            return reversedMessages.length;
        } else {
            return index;
        }
    }
}
