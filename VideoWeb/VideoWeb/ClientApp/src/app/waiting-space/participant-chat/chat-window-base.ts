import {
    AfterViewChecked,
    ElementRef,
    EventEmitter,
    HostListener,
    Injectable,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Guid } from 'guid-typescript';
import { Subscription } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ChatResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { ChatBaseComponent } from 'src/app/shared/chat/chat-base.component';
import { ImHelper } from 'src/app/shared/im-helper';
import { Hearing } from 'src/app/shared/models/hearing';
import { TranslateService } from '@ngx-translate/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Injectable()
export abstract class ChatWindowBaseComponent extends ChatBaseComponent implements OnInit, OnDestroy, AfterViewChecked {
    private chatHubSubscription: Subscription;

    public unreadMessageCount: number;
    public loading: boolean;
    abstract autoShowChat: boolean;

    @Input() public alwaysOn = false;
    @Input() public showChat = false;
    @Input() public hearing: Hearing;
    @Output() public unreadCount = new EventEmitter<number>();

    @ViewChild('content', { static: false }) content: ElementRef;

    constructor(
        protected videoWebService: VideoWebService,
        protected profileService: ProfileService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected oidcSecurityService: OidcSecurityService,
        protected imHelper: ImHelper,
        protected route: ActivatedRoute,
        protected translateService: TranslateService
    ) {
        super(videoWebService, profileService, eventService, logger, oidcSecurityService, imHelper, translateService);
    }

    _participantUsername: string;

    get participantUsername(): string {
        return this._participantUsername;
    }

    get participantId() {
        return this.loggedInUser.participant_id;
    }

    ngOnInit() {
        this.logger.debug(`[ChatHub Participant] starting chat for ${this.hearing.id}`);
        this.setUnreadMessageCount(0);
        this.loading = true;
        this.loggedInUser = this.route.snapshot.data['loggedUser'];
        this.logger.debug(`[ChatHub Participant] get logged participant id: ${this.loggedInUser.participant_id}`);
        this.setupChatSubscription().then(sub => (this.chatHubSubscription = sub));
        this.retrieveChatForConference(this.loggedInUser.participant_id).then(messages => {
            this.handleChatHistoryResponse(messages);
        });

        this.oidcSecurityService.userData$.subscribe(ud => (this._participantUsername = ud.preferred_username.toLowerCase()));
    }

    ngAfterViewChecked(): void {
        if (this.showChat) {
            this.setUnreadMessageCount(0);
            this.scrollToBottom();
        }
    }

    setUnreadMessageCount(quantity: number) {
        this.unreadMessageCount = quantity;
        this.unreadCount?.emit(quantity);
    }

    handleChatHistoryResponse(messages: InstantMessage[]) {
        this.setUnreadMessageCount(this.getCountSinceUsersLastMessage(messages));
        this.loading = false;
        this.messages = messages;
        if (this.unreadMessageCount > 0 && this.autoShowChat) {
            this.toggleChatDisplay();
        }
    }

    async sendMessage(messageBody: string) {
        const im = new InstantMessage({
            conferenceId: this.hearing.id,
            id: Guid.create().toString(),
            to: this.DEFAULT_ADMIN_USERNAME,
            from: this.loggedInUser.participant_id,
            from_display_name: 'You',
            is_user: true,
            message: messageBody,
            timestamp: new Date(new Date().toUTCString())
        });
        im.failedToSend = false;
        await this.sendInstantMessage(im);
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        this.logger.debug(`[ChatHub Judge] closing chat for ${this.hearing.id}`);
        if (this.chatHubSubscription) {
            this.chatHubSubscription.unsubscribe();
        }
    }

    handleIncomingOtherMessage(message: InstantMessage) {
        if (!this.showChat && !message.is_user) {
            this.setUnreadMessageCount(this.unreadMessageCount + 1);
        }

        if (!this.showChat && this.autoShowChat) {
            this.toggleChatDisplay();
        }
        this.disableScrollDown = false;
        this.scrollToBottom();
    }

    toggleChatDisplay() {
        this.showChat = !this.showChat;
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
