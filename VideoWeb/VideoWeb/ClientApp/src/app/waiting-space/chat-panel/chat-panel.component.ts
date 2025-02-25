import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ImHelper } from 'src/app/shared/im-helper';
import { ChatWindowBaseComponent } from '../participant-chat/chat-window-base';
import { TranslateService } from '@ngx-translate/core';
import { SecurityServiceProvider } from 'src/app/security/authentication/security-provider.service';

@Component({
    standalone: false,
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
        protected eventService: EventsService,
        protected logger: Logger,
        securityServiceProviderService: SecurityServiceProvider,
        protected imHelper: ImHelper,
        protected route: ActivatedRoute,
        protected translateService: TranslateService
    ) {
        super(videoWebService, eventService, logger, securityServiceProviderService, imHelper, route, translateService);
    }
}
