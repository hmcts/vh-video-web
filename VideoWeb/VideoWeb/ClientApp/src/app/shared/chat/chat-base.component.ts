import { Component, Input, NgZone } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { Subscription } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ChatResponse, ConferenceResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { Hearing } from 'src/app/shared/models/hearing';

@Component({
    template: ''
})
export abstract class ChatBaseComponent {
    protected _hearing: Hearing;
    protected chatHubSubscription: Subscription = new Subscription();

    messages: ChatResponse[];

    @Input() set conference(conference: ConferenceResponse) {
        this._hearing = new Hearing(conference);
    }

    constructor(
        protected videoWebService: VideoWebService,
        protected ngZone: NgZone,
        protected eventService: EventsService,
        protected logger: Logger,
        protected adalService: AdalService
    ) {}

    abstract sendMessage(): void;
    abstract getMessageWindow(): HTMLElement;

    setupChatSubscription(): any {
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
            if (participant) {
                message.from = participant.displayName;
            } else {
                message.from = 'VH Officer';
            }
            message.is_user = false;
        }
        this.messages.push(message);
    }

    async retrieveChatForConference(): Promise<void> {
        this.messages = await this.videoWebService.getConferenceChatHistory(this._hearing.id).toPromise();
    }

    onKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' && event.shiftKey) {
            this.sendMessage();
        }
    }
}
