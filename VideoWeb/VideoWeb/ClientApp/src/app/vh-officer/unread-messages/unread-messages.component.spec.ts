import { fakeAsync, tick } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { UnreadAdminMessageResponse, UnreadInstantMessageConferenceCountResponse } from 'src/app/services/clients/api-client';
import { EmitEvent, EventBusService, VHEventType } from 'src/app/services/event-bus.service';
import { ConferenceMessageAnswered } from 'src/app/services/models/conference-message-answered';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { adminAnsweredChatSubjectMock, eventsServiceSpy, messageSubjectMock } from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { InstantMessage } from '../../services/models/instant-message';
import { Hearing } from '../../shared/models/hearing';
import { UnreadMessagesComponent } from './unread-messages.component';

describe('UnreadMessagesComponent', () => {
    let component: UnreadMessagesComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    const eventsService = eventsServiceSpy;
    let eventbus: jasmine.SpyObj<EventBusService>;
    const conference = new ConferenceTestData().getConferenceDetailNow();
    let logger: MockLogger;

    let unreadConferenceResponse: UnreadInstantMessageConferenceCountResponse;

    beforeAll(() => {
        eventbus = jasmine.createSpyObj<EventBusService>('EventBusService', ['emit', 'on']);

        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getUnreadMessageCountForConference']);

        logger = new MockLogger();
    });

    beforeEach(() => {
        const unreadMessages = conference.participants.map(
            p =>
                new UnreadAdminMessageResponse({
                    number_of_unread_messages: 5,
                    participant_id: p.id
                })
        );
        unreadConferenceResponse = new UnreadInstantMessageConferenceCountResponse({
            number_of_unread_messages_conference: unreadMessages
        });
        videoWebServiceSpy.getUnreadMessageCountForConference.and.callFake(() => Promise.resolve(unreadConferenceResponse));

        component = new UnreadMessagesComponent(videoWebServiceSpy, eventsService, logger, eventbus);
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
        const participantId = conference.participants[0].id;
        const expectedCount = 5 * (conference.participants.length - 1);
        component.resetUnreadCounter(conferenceId, participantId);
        expect(component.unreadCount).toBe(expectedCount);
    });

    it('should reset unread message counter when admin has answered', () => {
        const conferenceId = conference.id;
        const participantId = conference.participants[0].id;
        const expectedCount = 5 * (conference.participants.length - 1);
        component.setupSubscribers();
        const payload = new ConferenceMessageAnswered(conferenceId, participantId);

        adminAnsweredChatSubjectMock.next(payload);

        expect(component.unreadCount).toBe(expectedCount);
    });

    it('should not reset unread message counter when conference id does not exist', () => {
        const conferenceId = Guid.create().toString();
        const participantId = conference.participants[0].id;
        const expectedCount = 5 * conference.participants.length;
        component.setupSubscribers();
        const payload = new ConferenceMessageAnswered(conferenceId, participantId);

        adminAnsweredChatSubjectMock.next(payload);

        expect(component.unreadCount).toBe(expectedCount);
    });

    it('should return IM image if are unread messages', () => {
        component.unreadMessages = [
            new UnreadAdminMessageResponse({ participant_id: conference.participants[0].id, number_of_unread_messages: 5 })
        ];
        expect(component.getIMStatus()).toBe('IM_icon.png');
    });

    it('should return empty image if there are no unread messages', () => {
        component.unreadMessages = [
            new UnreadAdminMessageResponse({ participant_id: conference.participants[0].id, number_of_unread_messages: 0 })
        ];
        expect(component.getIMStatus()).toBe('IM-empty.png');
    });

    it('should increase unread count when non-admin sends a message', async () => {
        component.hearing = new Hearing(conference);
        const conferenceId = conference.id;
        const participantId = conference.participants[0].id;
        const expectedCount = component.unreadCount;
        component.setupSubscribers();
        messageSubjectMock.next(
            new InstantMessage({
                conferenceId: conferenceId,
                from: participantId,
                to: 'Admin'
            })
        );
        expect(component.unreadCount).toBe(expectedCount + 1);
    });

    it('should increase unread count when non-admin sends first message', () => {
        component.unreadMessages = [];
        component.hearing = new Hearing(conference);
        const conferenceId = conference.id;
        const participantId = conference.participants[0].id;
        const expectedCount = component.unreadCount;
        component.setupSubscribers();
        messageSubjectMock.next(
            new InstantMessage({
                conferenceId: conferenceId,
                from: participantId,
                to: 'Admin'
            })
        );
        expect(component.unreadCount).toBe(expectedCount + 1);
    });

    it('should not increase unread count when admin sends a message', () => {
        const conferenceId = conference.id;
        const participantUsername = 'admin@hmcts.net';
        const expectedCount = component.unreadCount;
        component.setupSubscribers();
        messageSubjectMock.next(
            new InstantMessage({
                conferenceId,
                from: participantUsername
            })
        );
        expect(component.unreadCount).toBe(expectedCount);
    });

    it('should not increase unread count when message is for a different conference', () => {
        const conferenceId = Guid.create().toString();
        const participantId = conference.participants[0].id;
        const expectedCount = component.unreadCount;
        component.incrementUnreadCounter(conferenceId, participantId);
        expect(component.unreadCount).toBe(expectedCount);
    });

    it('should not increase unread count when message is for participant not in conference', () => {
        const conferenceId = conference.id;
        const participantUsername = 'random@hmcts.net';
        const expectedCount = component.unreadCount;
        component.setupSubscribers();
        messageSubjectMock.next(
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

    it('should emit open im chat event', () => {
        const expected = new EmitEvent(VHEventType.ConferenceImClicked, null);
        component.openImChat();
        expect(eventbus.emit).toHaveBeenCalledWith(expected);
    });
});
