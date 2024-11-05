import { Subscription } from 'rxjs';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceMessageAnswered } from 'src/app/services/models/conference-message-answered';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { Hearing } from 'src/app/shared/models/hearing';

export abstract class UnreadMessagesComponentBase {
    messagesSubscription$: Subscription = new Subscription();

    protected constructor(
        protected eventsService: EventsService,
        protected logger: Logger
    ) {}

    abstract get unreadCount(): number;

    getIMStatus(): string {
        return this.unreadCount > 0 ? 'IM_icon.png' : 'IM-empty.png';
    }

    setupSubscribers() {
        this.messagesSubscription$.add(
            this.eventsService.getAdminAnsweredChat().subscribe(message => {
                this.logger.debug(`[UnreadMesssage] - An admin has answered ${message.conferenceId}`);
                this.handleAdminAnsweredChat(message);
            })
        );

        this.messagesSubscription$.add(
            this.eventsService.getChatMessage().subscribe(message => {
                this.logger.debug(`[UnreadMesssage] - An admin has received a message ${message.conferenceId}`);
                this.handleImReceived(message);
            })
        );
    }

    handleAdminAnsweredChat(message: ConferenceMessageAnswered) {
        this.resetUnreadCounter(message.conferenceId, message.participantId);
    }

    protected messageFromParticipant(message: InstantMessage): boolean {
        return this.getHearing()
            .participants.map(p => p.id.toUpperCase())
            .includes(message.from.toUpperCase());
    }

    protected clearMessageSubscription() {
        this.messagesSubscription$.unsubscribe();
    }

    abstract getHearing(): Hearing;
    abstract resetUnreadCounter(conferenceId: string, participantId: string): void;
    abstract incrementUnreadCounter(conferenceId: string, participantId: string): void;
    abstract openImChat(): void;
    abstract handleImReceived(message: InstantMessage): void;
}
