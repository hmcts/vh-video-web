import { Component, ElementRef, OnDestroy } from '@angular/core';
import { Subject, Subscription, combineLatest } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { LoggedParticipantResponse, UserProfileResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { Hearing } from 'src/app/shared/models/hearing';
import { ImHelper } from '../im-helper';
import { TranslateService } from '@ngx-translate/core';
import { SecurityServiceProvider } from 'src/app/security/authentication/security-provider.service';
import { ISecurityService } from 'src/app/security/authentication/security-service.interface';
import { takeUntil } from 'rxjs/operators';
import { IdpProviders } from 'src/app/security/idp-providers';

@Component({
    selector: 'app-chat-base-component',
    template: ''
})
export abstract class ChatBaseComponent implements OnDestroy {
    messages: InstantMessage[] = [];
    pendingMessages: Map<string, InstantMessage[]> = new Map<string, InstantMessage[]>();
    loggedInUserProfile: UserProfileResponse;
    disableScrollDown = false;
    loggedInUser: LoggedParticipantResponse;
    emptyGuid = '00000000-0000-0000-0000-000000000000';

    DEFAULT_ADMIN_USERNAME = 'Admin';
    currentIdp: IdpProviders;

    protected hearing: Hearing;
    protected securityService: ISecurityService;
    protected destroyed$ = new Subject();

    abstract content: ElementRef<HTMLElement>;

    protected constructor(
        protected videoWebService: VideoWebService,
        protected eventService: EventsService,
        protected logger: Logger,
        securityServiceProviderService: SecurityServiceProvider,
        protected imHelper: ImHelper,
        protected translateService: TranslateService
    ) {
        combineLatest([securityServiceProviderService.currentSecurityService$, securityServiceProviderService.currentIdp$])
            .pipe(takeUntil(this.destroyed$))
            .subscribe(([service, idp]) => {
                this.securityService = service;
                this.currentIdp = idp;
            });
    }

    get pendingMessagesForConversation(): InstantMessage[] {
        if (this.pendingMessages.has(this.participantUsername)) {
            return this.pendingMessages.get(this.participantUsername);
        } else {
            return [];
        }
    }

    abstract get participantUsername(): string;
    abstract get participantId(): string;

    ngOnDestroy(): void {
        this.destroyed$.next();
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

        this.securityService
            .getUserData(this.currentIdp)
            .pipe(takeUntil(this.destroyed$))
            .subscribe(async ud => {
                const from = message.from.toUpperCase();
                const username =
                    this.loggedInUser && this.loggedInUser.participant_id && this.loggedInUser.participant_id !== this.emptyGuid
                        ? this.loggedInUser.participant_id
                        : ud.preferred_username.toUpperCase();
                if (from === username.toUpperCase()) {
                    message.from_display_name = this.translateService.instant('chat-base.you');
                    message.is_user = true;
                } else {
                    message.is_user = false;
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
        this.removeMessageFromPending(instantMessage);
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

    abstract sendMessage(messageBody: string): void;
    abstract handleIncomingOtherMessage(messsage: InstantMessage);
}
