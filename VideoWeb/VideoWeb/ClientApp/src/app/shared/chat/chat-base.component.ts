import { Input, NgZone } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { Subscription } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ChatResponse, ConferenceResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { Hearing } from 'src/app/shared/models/hearing';

export abstract class ChatBaseComponent {
    protected _hearing: Hearing;
    protected chatHubSubscription: Subscription;

    messages: ChatResponse[];

    @Input() set conference(conference: ConferenceResponse) {
        this._hearing = new Hearing(conference);
    }

    constructor(
        protected videoWebService: VideoWebService,
        protected profileService: ProfileService,
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
        this.chatHubSubscription = this.eventService.getChatMessage().subscribe(message => {
            this.ngZone.run(async () => {
                await this.handleIncomingMessage(message);
            });
        });
    }

    async handleIncomingMessage(message: ChatResponse) {
        const from = message.from.toUpperCase();
        const username = this.adalService.userInfo.userName.toUpperCase();
        if (from === username) {
            message.from = 'You';
            message.is_user = true;
        } else {
            message.from = await this.assignMessageFrom(from);
            message.is_user = false;
            this.handleIncomingOtherMessage();
        }
        this.messages.push(message);
    }

    async assignMessageFrom(username: string): Promise<string> {
        const participant = this._hearing.getParticipantByUsername(username);
        if (participant) {
            return participant.displayName;
        } else {
            const profile = await this.profileService.getProfileByUsername(username);
            return profile.first_name;
        }
    }

    handleIncomingOtherMessage() {}

    async retrieveChatForConference(): Promise<ChatResponse[]> {
        this.messages = await this.videoWebService.getConferenceChatHistory(this._hearing.id).toPromise();
        return this.messages;
    }

    onKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.altKey && !event.shiftKey && !event.ctrlKey) {
            event.stopPropagation();
            event.preventDefault();
            this.sendMessage();
        }
    }
}
