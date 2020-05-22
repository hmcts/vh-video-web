import { Input } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { Subscription } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse, UserProfileResponse, Role } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { InstantMessage, ExtendMessageInfo } from 'src/app/services/models/instant-message';
import { Hearing } from 'src/app/shared/models/hearing';

export abstract class ChatBaseComponent {
    protected hearing: Hearing;
    messages: InstantMessage[];

    @Input() set conference(conference: ConferenceResponse) {
        this.hearing = new Hearing(conference);
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
            next: async (message) => {
                await this.handleIncomingMessage(message);
            }
        });

        this.eventService.start();
        return sub;
    }

    async handleIncomingMessage(message: InstantMessage) {
        // ignore if not for current conference
        if (message.conferenceId !== this.hearing.id) {
            return;
        }

        // ignore if already received message
        if (this.messages.findIndex((m) => m.id === message.id) > -1) {
            const logInfo = Object.assign({}, message);
            delete logInfo.message;
            this.logger.debug(`[ChatHub] message already been processed ${JSON.stringify(logInfo)}`);
            return;
        }

        const from = message.from.toUpperCase();
        const username = this.adalService.userInfo.userName.toUpperCase();
        if (from === username) {
            message.from = 'You';
            message.is_user = true;
        } else {
            const userInfo = await this.assignMessageFrom(from);
            message.from = userInfo.from;
            message.isJudge = userInfo.isJudge;
            message.is_user = false;
            this.handleIncomingOtherMessage();
        }

        this.messages.push(message);
    }

    async assignMessageFrom(username: string): Promise<ExtendMessageInfo> {
        const participant = this.hearing.getParticipantByUsername(username);
        if (participant) {
            return new ExtendMessageInfo(participant.displayName, participant.isJudge);
        } else {
            const profile = await this.getProfileForUser(username);
            return new ExtendMessageInfo(profile.first_name, profile.role === Role.Judge);
        }
    }

    private async getProfileForUser(username: string): Promise<UserProfileResponse> {
        const profile = this.profileService.checkCacheForProfileByUsername(username);
        if (profile) {
            return profile;
        }
        return await this.profileService.getProfileByUsername(username);
    }

    handleIncomingOtherMessage() {}

    async retrieveChatForConference(): Promise<InstantMessage[]> {
        this.messages = (await this.videoWebService.getConferenceChatHistory(this.hearing.id)).map((m) => {
            const im = new InstantMessage(m);
            im.conferenceId = this.hearing.id;
            return im;
        });
        return this.messages;
    }
}
