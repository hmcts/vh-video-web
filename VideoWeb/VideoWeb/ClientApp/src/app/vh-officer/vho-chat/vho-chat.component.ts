import { Component, HostListener, NgZone, OnDestroy, OnInit, EventEmitter, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { AdalService } from 'adal-angular4';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ChatBaseComponent } from 'src/app/shared/chat/chat-base.component';
import { ConferenceUnreadMessageCount } from './vho-conference-unread_message-count.model';

@Component({
    selector: 'app-vho-chat',
    templateUrl: './vho-chat.component.html',
    styleUrls: ['./vho-chat.component.scss']
})
export class VhoChatComponent extends ChatBaseComponent implements OnInit, OnDestroy {
    sectionDivWidth: number;

    newMessageBody: FormControl;

    @Output() unreadMessageCount = new EventEmitter<ConferenceUnreadMessageCount>();

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.updateDivWidthForSection();
    }

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
        this.updateDivWidthForSection();
        this.initForm();
        this.retrieveChatForConference().then(() => this.setupChatSubscription());
    }

    initForm() {
        this.newMessageBody = new FormControl(null, [Validators.required, Validators.minLength(1), Validators.maxLength(256)]);
    }

    updateDivWidthForSection(): void {
        const listColumnElement: HTMLElement = document.getElementById('list-column');
        const listWidth = listColumnElement.offsetWidth;
        const windowWidth = window.innerWidth;
        const frameWidth = windowWidth - listWidth - 60;
        this.sectionDivWidth = frameWidth;
    }

    sendMessage() {
        console.log(this.newMessageBody);
        if (this.newMessageBody.invalid) {
            return;
        }
        const messageBody = this.newMessageBody.value;
        this.newMessageBody.reset();
        this.eventService.sendMessage(this._hearing.id, messageBody);
    }

    getMessageWindow(): HTMLElement {
        return document.getElementById('chat-list');
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        if (this.chatHubSubscription) {
            this.chatHubSubscription.unsubscribe();
        }
    }
}
