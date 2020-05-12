import { Component, EventEmitter, HostListener, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { AdalService } from 'adal-angular4';
import { Subscription } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ChatBaseComponent } from 'src/app/shared/chat/chat-base.component';
import { VHODashboardHelper } from '../helper';
import { ConferenceUnreadMessageCount } from './vho-conference-unread_message-count.model';

@Component({
    selector: 'app-vho-chat',
    templateUrl: './vho-chat.component.html',
    styleUrls: ['./vho-chat.component.scss', '../vho-global-styles.scss']
})
export class VhoChatComponent extends ChatBaseComponent implements OnInit, OnDestroy {
    sectionDivWidth: number;
    newMessageBody: FormControl;
    private chatHubSubscription: Subscription;
    loading: boolean;

    @Output() unreadMessageCount = new EventEmitter<ConferenceUnreadMessageCount>();

    @HostListener('window:resize')
    onResize() {
        this.updateDivWidthForSection();
    }

    constructor(
        protected videoWebService: VideoWebService,
        protected profileService: ProfileService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected adalService: AdalService
    ) {
        super(videoWebService, profileService, eventService, logger, adalService);
    }

    async ngOnInit() {
        this.logger.debug(`[ChatHub VHO] starting chat for ${this.hearing.id}`);
        this.updateDivWidthForSection();
        this.initForm();
        this.chatHubSubscription = this.setupChatSubscription();
        this.loading = true;
        this.retrieveChatForConference().then(messages => {
            this.messages = messages;
            this.loading = false;
        });
    }

    initForm() {
        this.newMessageBody = new FormControl(null, [Validators.required, Validators.minLength(1), Validators.maxLength(256)]);
    }

    updateDivWidthForSection(): void {
        this.sectionDivWidth = new VHODashboardHelper().getWidthAvailableForConference();
    }

    sendMessage(messageBody: string) {
        this.eventService.sendMessage(this.hearing.id, messageBody);
    }

    getMessageWindow(): HTMLElement {
        return document.getElementById('chat-list');
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        this.logger.debug(`[ChatHub VHO] closing chat for ${this.hearing.id}`);
        if (this.chatHubSubscription) {
            this.chatHubSubscription.unsubscribe();
        }
    }
}
