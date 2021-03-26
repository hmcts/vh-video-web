import { ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { LoggedParticipantResponse, UserProfileResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { Hearing } from 'src/app/shared/models/hearing';
import { ImHelper } from '../im-helper';
import { TranslateService } from '@ngx-translate/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

export abstract class ChatBaseComponent {
    protected hearing: Hearing;
    messages: InstantMessage[] = [];
    pendingMessages: Map<string, InstantMessage[]> = new Map<string, InstantMessage[]>();
    loggedInUserProfile: UserProfileResponse;
    disableScrollDown = false;
    loggedInUser: LoggedParticipantResponse;
    emptyGuid = '00000000-0000-0000-0000-000000000000';

    DEFAULT_ADMIN_USERNAME = 'Admin';
    protected constructor(
        protected videoWebService: VideoWebService,
        protected profileService: ProfileService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected oidcSecurityService: OidcSecurityService,
        protected imHelper: ImHelper,
        protected translateService: TranslateService
    ) {}

    abstract content: ElementRef<HTMLElement>;
    abstract sendMessage(messageBody: string): void;
    abstract get participantUsername(): string;
    abstract get participantId(): string;
    get pendingMessagesForConversation(): InstantMessage[] {
        if (this.pendingMessages.has(this.participantUsername)) {
            return this.pendingMessages.get(this.participantUsername);
        } else {
            return [];
        }
    }

    async setupChatSubscription(): Promise<Subscription> {
        this.logger.debug('[ChatHub] Subscribing');
        this.translateService.onLangChange.subscribe(() => {
            this.messages
                .filter(m => m.is_user)
                .forEach(m => {
                    m.from_display_name = this.translateService.instant('chat-base.you');
                });
        });

        return this.eventService.getChatMessage().subscribe({
            next: async message => {
                await this.handleIncomingMessage(message);
            }
        });
    }

    async handleIncomingMessage(message: InstantMessage) {
        if (!this.isMessageRecipientForUser(message)) {
            return;
        }

        this.oidcSecurityService.userData$.subscribe(async ud => {
            const from = message.from.toUpperCase();
            const username =
                this.loggedInUser && this.loggedInUser.participant_id && this.loggedInUser.participant_id !== this.emptyGuid
                    ? this.loggedInUser.participant_id
                    : ud.preferred_username.toUpperCase();
            if (from === username.toUpperCase()) {
                message.from_display_name = this.translateService.instant('chat-base.you');
                message.is_user = true;
            } else {
                message = await this.verifySender(message);
                this.handleIncomingOtherMessage(message);
            }

            this.removeMessageFromPending(message);
            this.messages.push(message);
        });
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

        return this.imHelper.isImForUser(message, this.participantId, this.loggedInUser);
    }

    async verifySender(message: InstantMessage): Promise<InstantMessage> {
        if (message.from !== this.DEFAULT_ADMIN_USERNAME) {
            message.from_display_name = await this.getDisplayNameForSender(message.from);
        }
        message.is_user = false;
        return message;
    }

    async getDisplayNameForSender(participantId: string): Promise<string> {
        const participant = this.hearing.getParticipantById(participantId);
        if (participant) {
            return participant.displayName;
        } else {
            // if it's not a participant then we have username of vho
            const profile = await this.getProfileForUser(participantId);
            return profile.first_name;
        }
    }

    private async getProfileForUser(username: string): Promise<UserProfileResponse> {
        const profile = this.profileService.checkCacheForProfileByUsername(username);
        if (profile) {
            return Promise.resolve(profile);
        }
        return this.profileService.getProfileByUsername(username);
    }

    abstract handleIncomingOtherMessage(messsage: InstantMessage);

    async retrieveChatForConference(participantId: string): Promise<InstantMessage[]> {
        this.messages = (await this.videoWebService.getConferenceChatHistory(this.hearing.id, participantId)).map(m => {
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
            if (index > -1) {
                entry[index].failedToSend = true;
            }
        }
    }
}
