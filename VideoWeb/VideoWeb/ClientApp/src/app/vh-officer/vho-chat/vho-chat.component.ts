import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { AdalService } from 'adal-angular4';
import { Subscription } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ChatBaseComponent } from 'src/app/shared/chat/chat-base.component';
import { ImHelper } from 'src/app/shared/im-helper';
import { Hearing } from 'src/app/shared/models/hearing';
import { Participant } from 'src/app/shared/models/participant';
import { ConferenceUnreadMessageCount } from './vho-conference-unread_message-count.model';

@Component({
    selector: 'app-vho-chat',
    templateUrl: './vho-chat.component.html',
    styleUrls: ['./vho-chat.component.scss', '../vho-global-styles.scss']
})
export class VhoChatComponent extends ChatBaseComponent implements OnInit, OnDestroy {
    newMessageBody: FormControl;
    chatHubSubscription: Subscription;
    loading: boolean;

    @Input() hearing: Hearing;
    @Input() participant: Participant;
    @Output() unreadMessageCount = new EventEmitter<ConferenceUnreadMessageCount>();

    constructor(
        protected videoWebService: VideoWebService,
        protected profileService: ProfileService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected adalService: AdalService,
        protected imHelper: ImHelper
    ) {
        super(videoWebService, profileService, eventService, logger, adalService, imHelper);
    }

    ngOnInit() {
        this.logger.debug(`[ChatHub VHO] starting chat for ${this.hearing.id}`);
        this.initForm();
        this.loading = true;
        this.setupChatSubscription().then(sub => (this.chatHubSubscription = sub));
        this.retrieveChatForConference(this.participant.username).then(messages => {
            this.messages = messages;
            this.loading = false;
        });
    }

    initForm() {
        this.newMessageBody = new FormControl(null, [Validators.required, Validators.minLength(1), Validators.maxLength(256)]);
    }

    sendMessage(messageBody: string) {
        this.eventService.sendMessage(this.hearing.id, messageBody, this.participant.username);
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        this.logger.debug(`[ChatHub VHO] closing chat for ${this.hearing.id}`);
        if (this.chatHubSubscription) {
            this.chatHubSubscription.unsubscribe();
        }
    }
}
