import { Component, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ImHelper } from 'src/app/shared/im-helper';
import { ChatWindowBaseComponent } from '../participant-chat/chat-window-base';

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
        protected eventService: EventsService,
        protected logger: Logger,
        protected adalService: AdalService,
        protected imHelper: ImHelper,
        protected route: ActivatedRoute
    ) {
        super(videoWebService, profileService, eventService, logger, adalService, imHelper, route);
    }
}
