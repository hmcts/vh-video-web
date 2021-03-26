import {
    AfterViewChecked,
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Guid } from 'guid-typescript';
import { Subscription } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { ChatBaseComponent } from 'src/app/shared/chat/chat-base.component';
import { ImHelper } from 'src/app/shared/im-helper';
import { Hearing } from 'src/app/shared/models/hearing';
import { Participant } from 'src/app/shared/models/participant';
import { LoggedParticipantResponse, Role } from '../../services/clients/api-client';
import { ConferenceUnreadMessageCount } from './vho-conference-unread_message-count.model';
import { TranslateService } from '@ngx-translate/core';
import { OidcSecurityService } from 'angular-auth-oidc-client';

@Component({
    selector: 'app-vho-chat',
    templateUrl: './vho-chat.component.html',
    styleUrls: ['./vho-chat.component.scss', '../vho-global-styles.scss']
})
export class VhoChatComponent extends ChatBaseComponent implements OnInit, OnDestroy, AfterViewChecked {
    newMessageBody: FormControl;
    chatHubSubscription: Subscription;
    loading: boolean;

    private _participant: Participant;
    @ViewChild('content', { static: false }) content: ElementRef;

    @Input() set participant(value: Participant) {
        if (!this._participant) {
            this._participant = value;
        } else {
            this._participant = value;
            this.updateChatWindow();
        }
    }

    get participant(): Participant {
        return this._participant;
    }

    username: string;

    @Input() hearing: Hearing;
    @Output() unreadMessageCount = new EventEmitter<ConferenceUnreadMessageCount>();

    constructor(
        protected videoWebService: VideoWebService,
        protected profileService: ProfileService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected oidcSecurityService: OidcSecurityService,
        protected imHelper: ImHelper,
        protected translateService: TranslateService
    ) {
        super(videoWebService, profileService, eventService, logger, oidcSecurityService, imHelper, translateService);
    }

    get participantUsername() {
        return this._participant.id;
    }

    get participantId() {
        return this._participant.id;
    }

    ngAfterViewChecked(): void {
        this.scrollToBottom();
    }

    ngOnInit() {
        this.logger.debug(`[ChatHub VHO] starting chat for ${this.hearing.id}`);
        this.initForm();
        this.setupChatSubscription().then(sub => (this.chatHubSubscription = sub));
        this.updateChatWindow();
        this.oidcSecurityService.userData$.subscribe(ud => {
            this.username = ud.preferred_username;
            this.setLoggedAdminUser();
        });
    }

    updateChatWindow() {
        this.loading = true;
        this.messages = [];
        this.retrieveChatForConference(this.participant.id).then(messages => {
            this.messages = messages;
            this.loading = false;
        });
    }

    setLoggedAdminUser() {
        this.loggedInUser = new LoggedParticipantResponse({
            admin_username: this.username.toUpperCase(),
            display_name: this.DEFAULT_ADMIN_USERNAME,
            role: Role.VideoHearingsOfficer
        });
    }

    initForm() {
        this.newMessageBody = new FormControl(null, [Validators.required, Validators.minLength(1), Validators.maxLength(256)]);
    }

    async sendMessage(messageBody: string) {
        const im = new InstantMessage({
            conferenceId: this.hearing.id,
            id: Guid.create().toString(),
            to: this.participant.id,
            from: this.username,
            from_display_name: 'You',
            message: messageBody,
            is_user: true,
            timestamp: new Date(new Date().toUTCString())
        });
        await this.sendInstantMessage(im);
    }

    handleIncomingOtherMessage(messsage: InstantMessage) {
        // no special changes here
        this.disableScrollDown = false;
        this.scrollToBottom();
    }

    @HostListener('window:beforeunload')
    ngOnDestroy(): void {
        this.logger.debug(`[ChatHub VHO] closing chat for ${this.hearing.id}`);
        if (this.chatHubSubscription) {
            this.chatHubSubscription.unsubscribe();
        }
    }
}
