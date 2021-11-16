import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ImEventsService } from 'src/app/services/im-events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ImHelper } from 'src/app/shared/im-helper';
import { ChatWindowBaseComponent } from './chat-window-base';
import { TranslateService } from '@ngx-translate/core';
import { SecurityServiceProvider } from 'src/app/security/authentication/security-provider.service';

@Component({
    selector: 'app-participant-chat',
    templateUrl: './participant-chat.component.html',
    styleUrls: ['./participant-chat.component.scss'],
    inputs: ['alwaysOn', 'hearing'],
    outputs: ['unreadCount']
})
export class ParticipantChatComponent extends ChatWindowBaseComponent {
    @ViewChild('content', { static: false }) content: ElementRef;
    autoShowChat = true;

    constructor(
        protected videoWebService: VideoWebService,
        protected profileService: ProfileService,
        protected imEventService: ImEventsService,
        protected logger: Logger,
        protected imHelper: ImHelper,
        protected route: ActivatedRoute,
        protected translateService: TranslateService,
        securityServiceProviderService: SecurityServiceProvider
    ) {
        super(videoWebService, profileService, imEventService, logger, securityServiceProviderService, imHelper, route, translateService);
    }
}
