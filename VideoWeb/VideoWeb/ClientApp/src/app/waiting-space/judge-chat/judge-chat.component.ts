import { Component, NgZone, OnDestroy, OnInit, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { AdalService } from 'adal-angular4';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ChatBaseComponent } from 'src/app/shared/chat/chat-base.component';
import { ProfileService } from 'src/app/services/api/profile.service';

@Component({
    selector: 'app-judge-chat',
    templateUrl: './judge-chat.component.html',
    styleUrls: ['./judge-chat.component.scss']
})
export class JudgeChatComponent extends ChatBaseComponent implements OnInit, OnDestroy, AfterViewChecked {
    newMessageBody: FormControl;
    showChat: boolean;
    unreadMessageCount: number;

    constructor(
        protected videoWebService: VideoWebService,
        protected profileService: ProfileService,
        protected ngZone: NgZone,
        protected eventService: EventsService,
        protected logger: Logger,
        protected adalService: AdalService
    ) {
        super(videoWebService, profileService, ngZone, eventService, logger, adalService);
    }

    ngOnInit() {
        this.showChat = false;
        this.unreadMessageCount = 0;
        this.initForm();
        this.retrieveChatForConference().then(() => this.setupChatSubscription());
    }

    ngAfterViewChecked(): void {
        if (this.showChat) {
            this.resetUnreadMessageCount();
            this.getMessageWindow().focus();
        }
    }

    initForm() {
        this.newMessageBody = new FormControl(null, [Validators.required, Validators.minLength(1)]);
    }

    sendMessage() {
        if (this.newMessageBody.invalid) {
            return;
        }
        const messageBody = this.newMessageBody.value;
        console.log(messageBody);
        this.newMessageBody.reset();
        this.eventService.sendMessage(this._hearing.id, messageBody);
    }

    getMessageWindow(): HTMLElement {
        return document.getElementById('chat-list');
    }

    ngOnDestroy(): void {
        this.chatHubSubscription.unsubscribe();
    }

    toggleChatDisplay() {
        this.showChat = !this.showChat;
    }

    handleIncomingOtherMessage() {
        if (!this.showChat) {
            this.unreadMessageCount++;
        }
    }

    resetUnreadMessageCount() {
        this.unreadMessageCount = 0;
    }
}
