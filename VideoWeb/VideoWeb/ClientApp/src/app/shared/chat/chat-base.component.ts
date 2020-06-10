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
    messages: InstantMessage[];
    loggedInUserProfile: UserProfileResponse;

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
        this.messages.push(message);
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
        const isForUser = this.imHelper.isImForUser(message, this.hearing, this.loggedInUserProfile);
        return isForUser;
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

    handleIncomingOtherMessage(messsage: InstantMessage) {}

    async retrieveChatForConference(participantUsername: string): Promise<InstantMessage[]> {
        this.messages = (await this.videoWebService.getConferenceChatHistory(this.hearing.id, participantUsername)).map(m => {
            const im = new InstantMessage(m);
            im.conferenceId = this.hearing.id;
            return im;
        });
        return this.messages;
    }

    scrollToBottom() {
        try {
            this.content.nativeElement.scrollTop = this.content.nativeElement.scrollHeight;
        } catch (err) {}
    }
}
