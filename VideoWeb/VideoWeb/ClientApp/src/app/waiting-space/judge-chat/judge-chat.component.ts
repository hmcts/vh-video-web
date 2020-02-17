import { Component, NgZone, OnDestroy, OnInit, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { AdalService } from 'adal-angular4';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ChatBaseComponent } from 'src/app/shared/chat/chat-base.component';

@Component({
    selector: 'app-judge-chat',
    templateUrl: './judge-chat.component.html',
    styleUrls: ['./judge-chat.component.scss']
})
export class JudgeChatComponent extends ChatBaseComponent implements OnInit, OnDestroy, AfterViewChecked {
    newMessageBody: FormControl;
    showChat: boolean;

    @ViewChild('newMessageBox', { static: false }) messageTextBox: ElementRef<HTMLInputElement>;
    constructor(
        protected videoWebService: VideoWebService,
        protected ngZone: NgZone,
        protected eventService: EventsService,
        protected logger: Logger,
        protected adalService: AdalService
    ) {
        super(videoWebService, ngZone, eventService, logger, adalService);
    }

    ngOnInit() {
        this.showChat = false;
        this.initForm();
        this.retrieveChatForConference().then(() => this.setupChatSubscription());
    }

    ngAfterViewChecked(): void {
        if (this.showChat) {
            // focus on textbox
            this.messageTextBox.nativeElement.focus();
        }
    }

    initForm() {
        this.newMessageBody = new FormControl(null, Validators.required);
    }

    sendMessage() {
        const messageBody = this.newMessageBody.value;
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
}
