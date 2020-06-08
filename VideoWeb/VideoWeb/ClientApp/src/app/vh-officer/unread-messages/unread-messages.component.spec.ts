import { fakeAsync, tick } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { UnreadAdminMessageResponse, UnreadInstantMessageConferenceCountResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { ConferenceMessageAnswered } from 'src/app/services/models/conference-message-answered';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { InstantMessage } from '../../services/models/instant-message';
import { Hearing } from '../../shared/models/hearing';
import { UnreadMessagesComponent } from './unread-messages.component';

describe('UnreadMessagesComponent', () => {
    let component: UnreadMessagesComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let eventsService: jasmine.SpyObj<EventsService>;
    const conference = new ConferenceTestData().getConferenceDetailNow();
    const mockEventService = new MockEventsService();
    let logger: MockLogger;

    let unreadConferenceResponse: UnreadInstantMessageConferenceCountResponse;

    beforeAll(() => {
        eventsService = jasmine.createSpyObj<EventsService>('EventsService', ['start', 'getAdminAnsweredChat', 'getChatMessage']);

        eventsService.getAdminAnsweredChat.and.returnValue(mockEventService.adminAnsweredChatSubject.asObservable());
        eventsService.getChatMessage.and.returnValue(mockEventService.messageSubject.asObservable());

        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getUnreadMessageCountForConference']);

        logger = new MockLogger();
    });

    beforeEach(() => {
        const unreadMessages = conference.participants.map(
            p =>
                new UnreadAdminMessageResponse({
                    number_of_unread_messages: 5,
                    participant_username: p.username
                })
        );
        unreadConferenceResponse = new UnreadInstantMessageConferenceCountResponse({
            number_of_unread_messages_conference: unreadMessages
        });
        videoWebServiceSpy.getUnreadMessageCountForConference.and.callFake(() => Promise.resolve(unreadConferenceResponse));

        component = new UnreadMessagesComponent(videoWebServiceSpy, eventsService, logger);
        component.unreadMessages = unreadMessages;
        component.hearing = new Hearing(conference);
    });

    afterAll(() => {
        component.ngOnDestroy();
    });

    it('should init unread message count', fakeAsync(() => {
        const expectedCount = 5 * conference.participants.length;
        component.unreadMessages = undefined;
        component.ngOnInit();
        tick();
        expect(component.unreadCount).toBe(expectedCount);
    }));

    it('should log error when unable to init', fakeAsync(() => {
        const error = new Error('failed to find conference');
        videoWebServiceSpy.getUnreadMessageCountForConference.and.callFake(() => Promise.reject(error));
        const spy = spyOn(logger, 'error');
        component.ngOnInit();
        tick();
        expect(spy.calls.mostRecent().args[0]).toMatch(`Failed to get unread vho messages for`);
        expect(spy.calls.mostRecent().args[1]).toBe(error);
    }));

    it('should reset conference unread counter when vho sends a message', () => {
        const conferenceId = conference.id;
        const participantUsername = conference.participants[0].username;
        const expectedCount = 5 * (conference.participants.length - 1);
        component.resetUnreadCounter(conferenceId, participantUsername);
        expect(component.unreadCount).toBe(expectedCount);
    });

    it('should reset unread message counter when admin has answered', () => {
        const conferenceId = conference.id;
        const participantUsername = conference.participants[0].username;
        const expectedCount = 5 * (conference.participants.length - 1);
        component.setupSubscribers();
        const payload = new ConferenceMessageAnswered(conferenceId, participantUsername);

        mockEventService.adminAnsweredChatSubject.next(payload);

        expect(component.unreadCount).toBe(expectedCount);
    });

    it('should not reset unread message counter when conference id does not exist', () => {
        const conferenceId = Guid.create().toString();
        const participantUsername = conference.participants[0].username;
        const expectedCount = 5 * conference.participants.length;
        component.setupSubscribers();
        const payload = new ConferenceMessageAnswered(conferenceId, participantUsername);

        mockEventService.adminAnsweredChatSubject.next(payload);

        expect(component.unreadCount).toBe(expectedCount);
    });

    it('should return IM image if are unread messages', () => {
        component.unreadMessages = [new UnreadAdminMessageResponse({ participant_username: 'test@1.com', number_of_unread_messages: 5 })];
        expect(component.getIMStatus()).toBe('IM_icon.png');
    });

    it('should return empty image if there are no unread messages', () => {
        component.unreadMessages = [new UnreadAdminMessageResponse({ participant_username: 'test@1.com', number_of_unread_messages: 0 })];
        expect(component.getIMStatus()).toBe('IM-empty.png');
    });

    it('should increase unread count when non-admin sends a message', () => {
        const conferenceId = conference.id;
        const participantUsername = conference.participants[0].username;
        const expectedCount = component.unreadCount + 1;
        component.setupSubscribers();
        mockEventService.messageSubject.next(
            new InstantMessage({
                conferenceId: conferenceId,
                from: participantUsername
            })
        );
        expect(component.unreadCount).toBe(expectedCount);
    });

    it('should not increase unread count when admin sends a message', () => {
        const conferenceId = conference.id;
        const participantUsername = 'admin@test.com';
        const expectedCount = component.unreadCount;
        component.setupSubscribers();
        mockEventService.messageSubject.next(
            new InstantMessage({
                conferenceId,
                from: participantUsername
            })
        );
        expect(component.unreadCount).toBe(expectedCount);
    });

    it('should not increase unread count when message is for a different conference', () => {
        const conferenceId = Guid.create().toString();
        const participantUsername = conference.participants[0].username;
        const expectedCount = component.unreadCount;
        component.incrementUnreadCounter(conferenceId, participantUsername);
        expect(component.unreadCount).toBe(expectedCount);
    });

    it('should not increase unread count when message is for participant not in conference', () => {
        const conferenceId = conference.id;
        const participantUsername = 'random@test.com';
        const expectedCount = component.unreadCount;
        component.setupSubscribers();
        mockEventService.messageSubject.next(
            new InstantMessage({
                conferenceId: conferenceId,
                from: participantUsername
            })
        );
        expect(component.unreadCount).toBe(expectedCount);
    });

    it('should return zero when conference has no IMs', () => {
        unreadConferenceResponse = new UnreadInstantMessageConferenceCountResponse({
            number_of_unread_messages_conference: []
        });
        component.unreadMessages = unreadConferenceResponse.number_of_unread_messages_conference;

        expect(component.unreadCount).toBe(0);
        expect(component.getIMStatus()).toBe('IM-empty.png');
    });
});
