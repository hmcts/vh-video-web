import { ElementRef } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { Subscription } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { UserProfileResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { Hearing } from 'src/app/shared/models/hearing';
import { ImHelper } from '../im-helper';

export abstract class ChatBaseComponent {
    protected hearing: Hearing;
    messages: InstantMessage[] = [];
    pendingMessages: Map<string, InstantMessage[]> = new Map<string, InstantMessage[]>();
    loggedInUserProfile: UserProfileResponse;
    disableScrollDown = false;

    DEFAULT_ADMIN_USERNAME = 'Admin';
    protected constructor(
        protected videoWebService: VideoWebService,
        protected profileService: ProfileService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected adalService: AdalService,
        protected imHelper: ImHelper
    ) {}

    abstract content: ElementRef;
    abstract sendMessage(messageBody: string): void;
    abstract get participantUsername(): string;

    get pendingMessagesForConversation(): InstantMessage[] {
        if (this.pendingMessages.has(this.participantUsername)) {
            return this.pendingMessages.get(this.participantUsername);
        } else {
            return [];
        }
    }

    async setupChatSubscription(): Promise<Subscription> {
        if (!this.loggedInUserProfile) {
            this.loggedInUserProfile = await this.profileService.getUserProfile();
        }
        this.logger.debug('[ChatHub] Subscribing to chat messages');
        const sub = this.eventService.getChatMessage().subscribe({
            next: async message => {
                await this.handleIncomingMessage(message);
            }
        });

        await this.eventService.start();
        return sub;
    }

    async handleIncomingMessage(message: InstantMessage) {
        if (!this.isMessageRecipientForUser(message)) {
            return;
        }
        const from = message.from.toUpperCase();
        const username = this.adalService.userInfo.userName.toUpperCase();
        if (from === username) {
            message.from_display_name = 'You';
            message.is_user = true;
        } else {
            message = await this.verifySender(message);
            this.handleIncomingOtherMessage(message);
        }
        this.removeMessageFromPending(message);
        this.messages.push(message);
    }

    addMessageToPending(message: InstantMessage) {
        if (!this.pendingMessages.has(message.to)) {
            this.pendingMessages.set(message.to, []);
        }
        this.pendingMessages.get(message.to).push(message);
    }

    removeMessageFromPending(message: InstantMessage) {
        if (this.pendingMessages.has(message.to)) {
            this.pendingMessages.set(
                message.to,
                this.pendingMessages.get(message.to).filter(im => im.id !== message.id)
            );
        }
    }

    isMessageRecipientForUser(message: InstantMessage): boolean {
        // ignore if not for current conference or participant
        if (message.conferenceId !== this.hearing.id) {
            return false;
        }
        // ignore if already received message
        if (this.messages.findIndex(m => m.id === message.id) > -1) {
            const logInfo = Object.assign({}, message);
            delete logInfo.message;
            this.logger.debug(`[ChatHub] message already been processed ${JSON.stringify(logInfo)}`);
            return false;
        }

        return this.imHelper.isImForUser(message, this.participantUsername, this.loggedInUserProfile);
    }

    async verifySender(message: InstantMessage): Promise<InstantMessage> {
        if (message.from !== this.DEFAULT_ADMIN_USERNAME) {
            message.from_display_name = await this.getDisplayNameForSender(message.from);
        }
        message.is_user = false;
        return message;
    }

    async getDisplayNameForSender(username: string): Promise<string> {
        const participant = this.hearing.getParticipantByUsername(username);
        if (participant) {
            return participant.displayName;
        } else {
            const profile = await this.getProfileForUser(username);
            return profile.first_name;
        }
    }

    private async getProfileForUser(username: string): Promise<UserProfileResponse> {
        const profile = this.profileService.checkCacheForProfileByUsername(username);
        if (profile) {
            return profile;
        }
        return await this.profileService.getProfileByUsername(username);
    }

    abstract handleIncomingOtherMessage(messsage: InstantMessage);

    async retrieveChatForConference(participantUsername: string): Promise<InstantMessage[]> {
        this.messages = (await this.videoWebService.getConferenceChatHistory(this.hearing.id, participantUsername)).map(m => {
            const im = new InstantMessage(m);
            im.conferenceId = this.hearing.id;
            return im;
        });
        return this.messages;
    }

    scrollToBottom() {
        if (this.disableScrollDown) {
            return;
        }
        try {
            this.content.nativeElement.scrollTop = this.content.nativeElement.scrollHeight;
        } catch (err) {}
    }

    onScroll() {
        const element = this.content.nativeElement;
        const atBottom = element.scrollHeight - element.scrollTop === element.clientHeight;
        if (this.disableScrollDown && atBottom) {
            this.disableScrollDown = false;
        } else {
            this.disableScrollDown = true;
        }
    }

    async sendInstantMessage(instantMessage: InstantMessage) {
        this.addMessageToPending(instantMessage);
        await this.eventService.sendMessage(instantMessage);
        this.disableScrollDown = false;
        this.scrollToBottom();
        // 5 seconds is sufficient time to check if message has not returned
        setTimeout(() => {
            this.checkIfMessageFailed(instantMessage);
        }, 5000);
    }

    checkIfMessageFailed(instantMessage: InstantMessage) {
        if (this.messages.findIndex(x => x.id === instantMessage.id) < 0 && this.pendingMessages.has(instantMessage.to)) {
            const entry = this.pendingMessages.get(instantMessage.to);
            const index = entry.findIndex(x => x.id === instantMessage.id);
            entry[index].failedToSend = true;
        }
    }
}
