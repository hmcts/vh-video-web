import { Input } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { Subscription } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { Hearing } from 'src/app/shared/models/hearing';

export abstract class ChatBaseComponent {
    protected _hearing: Hearing;
    messages: InstantMessage[];

    @Input() set conference(conference: ConferenceResponse) {
        this._hearing = new Hearing(conference);
    }

    constructor(
        protected videoWebService: VideoWebService,
        protected profileService: ProfileService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected adalService: AdalService
    ) {}

    abstract sendMessage(messageBody: string): void;
    abstract getMessageWindow(): HTMLElement;

    setupChatSubscription(): Subscription {
        this.logger.debug('[ChatHub] Subscribing to chat messages');
        const sub = this.eventService.getChatMessage().subscribe({
            next: async message => {
                await this.handleIncomingMessage(message);
            }
        });

        this.eventService.start();
        return sub;
    }

    async handleIncomingMessage(message: InstantMessage) {
        // ignore if not for current conference
        if (message.conferenceId !== this._hearing.id) {
            return;
        }

        // ignore if already received message
        if (this.messages.findIndex(m => m.id === message.id) > -1) {
            this.logger.debug(`[ChatHub] message already been processed ${JSON.stringify(message)}`);
            return;
        }
        this.messages.push(message);

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

    async retrieveChatForConference(): Promise<InstantMessage[]> {
        this.messages = (await this.videoWebService.getConferenceChatHistory(this._hearing.id)).map(m => {
            const im = new InstantMessage(m);
            im.conferenceId = this._hearing.id;
            return im;
        });
        return this.messages;
    }
}
