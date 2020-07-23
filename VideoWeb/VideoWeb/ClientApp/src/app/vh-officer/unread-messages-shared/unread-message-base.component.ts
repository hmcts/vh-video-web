import { Subscription } from 'rxjs';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceMessageAnswered } from 'src/app/services/models/conference-message-answered';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { Hearing } from 'src/app/shared/models/hearing';

export abstract class UnreadMessagesComponentBase {
    messagesSubscription$: Subscription = new Subscription();

    protected constructor(protected eventsService: EventsService, protected logger: Logger) {}

    abstract get unreadCount(): number;
    abstract getHearing(): Hearing;
    abstract resetUnreadCounter(conferenceId: string, participantUsername: string): void;
    abstract incrementUnreadCounter(conferenceId: string, participantUsername: string): void;
    abstract openImChat();

    getIMStatus(): string {
        return this.unreadCount > 0 ? 'IM_icon.png' : 'IM-empty.png';
    }

    setupSubscribers() {
        this.messagesSubscription$.add(
            this.eventsService.getAdminAnsweredChat().subscribe(message => {
                this.logger.debug(`an admin has answered ${message.conferenceId}`);
                this.handleAdminAnsweredChat(message);
            })
        );

        this.messagesSubscription$.add(
            this.eventsService.getChatMessage().subscribe(message => {
                this.logger.debug(`an admin has received a message ${message.conferenceId}`);
                this.handleImReceived(message);
            })
        );
        this.eventsService.start();
    }

    handleAdminAnsweredChat(message: ConferenceMessageAnswered) {
        this.resetUnreadCounter(message.conferenceId, message.particpantUsername);
    }

    handleImReceived(message: InstantMessage) {
        if (this.getHearing().id === message.conferenceId && this.messageFromParticipant(message)) {
            this.incrementUnreadCounter(message.conferenceId, message.from);
        }
    }

    protected messageFromParticipant(message: InstantMessage): boolean {
        return this.getHearing()
            .participants.map(p => p.username.toUpperCase())
            .includes(message.from.toUpperCase());
    }

    protected clearMessageSubscription() {
        this.messagesSubscription$.unsubscribe();
    }
}
