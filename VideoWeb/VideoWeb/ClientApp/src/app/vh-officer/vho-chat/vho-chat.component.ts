import { Component, HostListener, Input, NgZone, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ChatResponse, ConferenceResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { AdalService } from 'adal-angular4';
import { Hearing } from 'src/app/shared/models/hearing';

@Component({
    selector: 'app-vho-chat',
    templateUrl: './vho-chat.component.html',
    styleUrls: ['./vho-chat.component.scss']
})
export class VhoChatComponent implements OnInit, OnDestroy {
    private _hearing: Hearing;
    @Input() set conference(conference: ConferenceResponse) {
        this._hearing = new Hearing(conference);
    }

    sectionDivWidth: number;
    chatHubSubscription: Subscription = new Subscription();

    messages: ChatResponse[];

    newMessageBody: FormControl;

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.updateDivWidthForSection();
    }

    constructor(
        private videoWebService: VideoWebService,
        private ngZone: NgZone,
        private eventService: EventsService,
        private logger: Logger,
        private adalService: AdalService
    ) {}

    ngOnInit() {
        this.updateDivWidthForSection();
        this.initForm();
        this.retrieveChatForConference().then(() => this.setupChatSubscription());
    }

    initForm() {
        this.newMessageBody = new FormControl(null, Validators.required);
    }

    setupChatSubscription(): any {
        this.logger.debug('Setting up VH Officer event subscribers');
        this.eventService.start();

        this.logger.debug('Subscribing to chat messages');
        this.chatHubSubscription.add(
            this.eventService.getChatMessage().subscribe(message => {
                this.ngZone.run(() => {
                    this.handleIncomingMessage(message);
                });
            })
        );
    }

    handleIncomingMessage(message: ChatResponse) {
        const from = message.from.toUpperCase();
        const username = this.adalService.userInfo.userName.toUpperCase();
        if (from === username) {
            message.from = 'You';
            message.is_user = true;
        } else {
            const participant = this._hearing.getParticipantByUsername(from);
            message.from = participant.displayName;
            message.is_user = false;
        }
        this.messages.push(message);
    }

    async retrieveChatForConference() {
        this.messages = await this.videoWebService.getConferenceChatHistory(this._hearing.id).toPromise();
        this.handleIncomingMessage(
            new ChatResponse({
                from: 'Manual01Judge01@hearings.reform.hmcts.net',
                message: 'test message from judge',
                timestamp: new Date(new Date().getUTCDate())
            })
        );

        this.handleIncomingMessage(
            new ChatResponse({
                from: 'Manual01VideoHearingsOfficer01@hearings.reform.hmcts.net',
                message: 'test message from vho',
                timestamp: new Date(new Date().getUTCDate())
            })
        );
    }

    updateDivWidthForSection(): void {
        const listColumnElement: HTMLElement = document.getElementById('list-column');
        const listWidth = listColumnElement.offsetWidth;
        const windowWidth = window.innerWidth;
        const frameWidth = windowWidth - listWidth - 60;
        this.sectionDivWidth = frameWidth;
    }

    async sendMessage() {
        console.log(this.newMessageBody);
        console.log(this.newMessageBody.value);
        this.newMessageBody.reset();
        // const message = 'Test Message ' + new Date().toUTCString();
        // this.eventService.sendMessage(this._hearing.id, message);
    }

    onKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' && event.shiftKey) {
            this.sendMessage();
        }
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        this.logger.debug('Clearing intervals and subscriptions for VH Officer');
        this.chatHubSubscription.unsubscribe();
    }
}
