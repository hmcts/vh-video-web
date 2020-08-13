import { Component, Input } from '@angular/core';
import { EventsService } from 'src/app/services/events.service';
import { InstantMessage } from 'src/app/services/models/instant-message';

@Component({
    selector: 'app-chat-body-window',
    templateUrl: './chat-body-window.component.html',
    styleUrls: ['./chat-body-window.component.scss', '../../vh-officer/vho-global-styles.scss']
})
export class ChatBodyWindowComponent {
    @Input() messagesReceived: InstantMessage[];
    @Input() pendingMessages: InstantMessage[];

    retryMessages: InstantMessage[] = [];

    constructor(private eventsService: EventsService) {}

    get allMessages(): InstantMessage[] {
        return [].concat(this.messagesReceived, this.pendingMessages);
    }

    async retry(instantMessage: InstantMessage) {
        if (this.retryMessages.findIndex(x => x.id === instantMessage.id) > -1) {
            return;
        }
        this.retryMessages.push(instantMessage);
        await this.eventsService.sendMessage(instantMessage);
    }

    hasMessageFailed(instantMessage: InstantMessage) {
        if (this.messagesReceived.includes(instantMessage)) {
            return false;
        }
        return instantMessage.is_user && instantMessage.failedToSend;
    }
}
