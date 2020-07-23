import { EventsService } from 'src/app/services/events.service';
import { ChatBodyWindowComponent } from './chat-body-window.component';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { Guid } from 'guid-typescript';

describe('ChatBodyWindowComponent', () => {
    let component: ChatBodyWindowComponent;
    let eventsService: jasmine.SpyObj<EventsService>;

    const imPending = new InstantMessage({
        conferenceId: Guid.create().toString(),
        id: Guid.create().toString(),
        to: 'test@to.com',
        from: 'other@from.com',
        from_display_name: 'You',
        message: 'i am pending',
        is_user: true,
        timestamp: new Date(new Date().toUTCString())
    });

    const imReceived = new InstantMessage({
        conferenceId: Guid.create().toString(),
        id: Guid.create().toString(),
        to: 'test@to.com',
        from: 'other@from.com',
        from_display_name: 'You',
        message: 'i have sent',
        is_user: true,
        timestamp: new Date(new Date().toUTCString())
    });

    beforeAll(() => {
        eventsService = jasmine.createSpyObj<EventsService>('EventsService', ['sendMessage']);
    });

    beforeEach(() => {
        component = new ChatBodyWindowComponent(eventsService);
        component.messagesReceived = [];
        component.pendingMessages = [];
    });

    it('should return combined list of pending and received messages', () => {
        component.messagesReceived = [imReceived];
        component.pendingMessages = [imPending];
        expect(component.allMessages.length).toBe(2);
    });

    it('should send message on retry', async () => {
        const im = new InstantMessage({
            conferenceId: Guid.create().toString(),
            id: Guid.create().toString(),
            to: 'test@to.com',
            from: 'other@from.com',
            from_display_name: 'You',
            message: 'i have sent',
            is_user: true,
            timestamp: new Date(new Date().toUTCString())
        });
        await component.retry(im);
        expect(eventsService.sendMessage).toHaveBeenCalledWith(im);
    });
    it('should not send message on retry if it was already send', async () => {
        const im = new InstantMessage({
            conferenceId: Guid.create().toString(),
            id: Guid.create().toString(),
            to: 'test@to.com',
            from: 'other@from.com',
            from_display_name: 'You',
            message: 'i have sent',
            is_user: true,
            timestamp: new Date(new Date().toUTCString())
        });
        component.retryMessages.push(im);
        eventsService.sendMessage.calls.reset();

        await component.retry(im);
        expect(eventsService.sendMessage).toHaveBeenCalledTimes(0);
    });


    it('should return false if message is in received list', () => {
        component.messagesReceived = [imReceived];
        expect(component.hasMessageFailed(imReceived)).toBeFalsy();
    });

    it('should return false is message is not from user', () => {
        const imtest = new InstantMessage(Object.assign({}, imReceived));
        imtest.is_user = false;

        expect(component.hasMessageFailed(imtest)).toBeFalsy();
    });

    it('should return true is message has failed to send', () => {
        const imtest = new InstantMessage(Object.assign({}, imReceived));

        imtest.is_user = true;
        imtest.failedToSend = true;

        expect(component.hasMessageFailed(imtest)).toBeTruthy();
    });
});
