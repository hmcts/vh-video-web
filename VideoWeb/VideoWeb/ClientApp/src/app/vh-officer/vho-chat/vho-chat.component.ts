import { Component, HostListener, NgZone, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { AdalService } from 'adal-angular4';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ChatBaseComponent } from 'src/app/shared/chat/chat-base.component';
import { ProfileService } from 'src/app/services/api/profile.service';

@Component({
    selector: 'app-vho-chat',
    templateUrl: './vho-chat.component.html',
    styleUrls: ['./vho-chat.component.scss']
})
export class VhoChatComponent extends ChatBaseComponent implements OnInit, OnDestroy {
    sectionDivWidth: number;

    newMessageBody: FormControl;

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
        this.newMessageBody = new FormControl(null, Validators.required);
    }

    updateDivWidthForSection(): void {
        const listColumnElement: HTMLElement = document.getElementById('list-column');
        const listWidth = listColumnElement.offsetWidth;
        const windowWidth = window.innerWidth;
        const frameWidth = windowWidth - listWidth - 60;
        this.sectionDivWidth = frameWidth;
    }

    sendMessage() {
        const messageBody = this.newMessageBody.value;
        this.newMessageBody.reset();
        this.eventService.sendMessage(this._hearing.id, messageBody);
    }

    getMessageWindow(): HTMLElement {
        return document.getElementById('chat-list');
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        this.chatHubSubscription.unsubscribe();
    }
}
