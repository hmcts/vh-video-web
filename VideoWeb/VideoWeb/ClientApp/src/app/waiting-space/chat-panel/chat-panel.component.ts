import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ImEventsService } from 'src/app/services/im-events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ImHelper } from 'src/app/shared/im-helper';
import { ChatWindowBaseComponent } from '../participant-chat/chat-window-base';
import { TranslateService } from '@ngx-translate/core';
import { SecurityServiceProvider } from 'src/app/security/authentication/security-provider.service';

@Component({
    selector: 'app-chat-panel',
    templateUrl: './chat-panel.component.html',
    styleUrls: ['./chat-panel.component.scss'],
    inputs: ['alwaysOn', 'hearing', 'showChat'],
    outputs: ['unreadCount']
})
export class ChatPanelComponent extends ChatWindowBaseComponent {
    @ViewChild('content', { static: false }) content: ElementRef;
    autoShowChat = false;

    constructor(
        protected videoWebService: VideoWebService,
        protected profileService: ProfileService,
        protected imEventService: ImEventsService,
        protected logger: Logger,
        securityServiceProviderService: SecurityServiceProvider,
        protected imHelper: ImHelper,
        protected route: ActivatedRoute,
        protected translateService: TranslateService
    ) {
        super(videoWebService, profileService, imEventService, logger, securityServiceProviderService, imHelper, route, translateService);
    }
}
