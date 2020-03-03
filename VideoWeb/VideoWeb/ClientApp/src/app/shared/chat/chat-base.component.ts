import { Input, NgZone } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { Subscription } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { Hearing } from 'src/app/shared/models/hearing';
import { InstantMessage } from 'src/app/services/models/instant-message';

export abstract class ChatBaseComponent {
    protected _hearing: Hearing;
    protected chatHubSubscription: Subscription;

    messages: InstantMessage[];

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
        this.logger.debug('Subscribing to chat messages');
        this.chatHubSubscription = this.eventService.getChatMessage().subscribe(message => {
            this.ngZone.run(async () => {
                await this.handleIncomingMessage(message);
            });
        });

        this.eventService.start();
    }

    async handleIncomingMessage(message: InstantMessage) {
        // ignore if not for current conference
        if (message.conferenceId !== this._hearing.id) {
            return;
        }

        // ignore if already received message
        if (this.messages.findIndex(m => m.id === message.id) > -1) {
            this.logger.debug(`message already been processed ${JSON.stringify(message)}`);
            return;
        }
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

    async retrieveChatForConference(): Promise<InstantMessage[]> {
        this.messages = (await this.videoWebService.getConferenceChatHistory(this._hearing.id).toPromise()).map(m => {
            const im = new InstantMessage(m);
            im.conferenceId = this._hearing.id;
            return im;
        });
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
