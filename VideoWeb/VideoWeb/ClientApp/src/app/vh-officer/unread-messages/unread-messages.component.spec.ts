import { fakeAsync, tick } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { UnreadAdminMessageResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { UnreadMessagesComponent } from './unread-messages.component';
import { InstantMessage } from '../../services/models/instant-message';
import { of } from 'rxjs';
import { Hearing } from '../../shared/models/hearing';

describe('UnreadMessagesComponent', () => {
    let component: UnreadMessagesComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let eventsService: jasmine.SpyObj<EventsService>;
    const conference = new ConferenceTestData().getConferenceDetailNow();
    const mockEventService = new MockEventsService();
    let logger: MockLogger;

    const unreadCountResponse = new UnreadAdminMessageResponse({
        number_of_unread_messages: 5
    });

    beforeAll(() => {
        eventsService = jasmine.createSpyObj<EventsService>('EventsService', ['start', 'getAdminAnsweredChat', 'getChatMessage']);

        eventsService.getAdminAnsweredChat.and.returnValue(mockEventService.adminAnsweredChatSubject.asObservable());
        eventsService.getChatMessage.and.returnValue(mockEventService.messageSubject.asObservable());

        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getUnreadAdminMessageCountForConference']);
        videoWebServiceSpy.getUnreadAdminMessageCountForConference.and.callFake(() => Promise.resolve(unreadCountResponse));

        logger = new MockLogger();
    });

    beforeEach(() => {
        component = new UnreadMessagesComponent(videoWebServiceSpy, eventsService, logger);
        component.conferenceId = conference.id;

        component.hearing = new Hearing(conference);
    });

    afterAll(() => {
        component.ngOnDestroy();
    });

    it('should init unread message count', fakeAsync(() => {
        component.ngOnInit();
        tick();
        expect(component.unreadCount).toBe(unreadCountResponse.number_of_unread_messages);
    }));

    it('should log error when unable to init', fakeAsync(() => {
        const error = new Error('failed to find conference');
        videoWebServiceSpy.getUnreadAdminMessageCountForConference.and.callFake(() => Promise.reject(error));
        const spy = spyOn(logger, 'error');
        component.ngOnInit();
        tick();
        expect(spy.calls.mostRecent().args[0]).toMatch(`Failed to get unread vho messages for`);
        expect(spy.calls.mostRecent().args[1]).toBe(error);
    }));

    it('should reset conference unread counter when vho sends a message', () => {
        component.resetConferenceUnreadCounter(conference.id);
        expect(component.unreadCount).toBe(0);
    });

    it('should reset unread message counter when admin has answered', () => {
        component.unreadCount = unreadCountResponse.number_of_unread_messages;
        component.setupSubscribers();
        mockEventService.adminAnsweredChatSubject.next(conference.id);

        expect(component.unreadCount).toBe(0);
    });

    it('should not reset unread message counter when conference id does not exist', () => {
        component.unreadCount = unreadCountResponse.number_of_unread_messages;
        component.setupSubscribers();
        mockEventService.adminAnsweredChatSubject.next(Guid.create().toString());

        expect(component.unreadCount).toBe(unreadCountResponse.number_of_unread_messages);
    });

    it('should return empty image if no unread messages', () => {
        component.unreadCount = 1;
        expect(component.getIMStatus()).toBe('IM_icon.png');
    });

    it('should return IM image if there are unread messages', () => {
        component.unreadCount = 0;
        expect(component.getIMStatus()).toBe('IM-empty.png');
    });
    it('should reset unread message counter when judge send a message', () => {
        component.unreadCount = unreadCountResponse.number_of_unread_messages;
        component.conferenceId = '12345';
        component.setupSubscribers();
        mockEventService.messageSubject.next(new InstantMessage({
            conferenceId: '12345', from: 'judge.fudge@hearings.net'
        }));

        expect(component.unreadCount).toBe(unreadCountResponse.number_of_unread_messages + 1);
    });
    it('should not increase unread message counter when admin send a message', () => {
        component.unreadCount = unreadCountResponse.number_of_unread_messages;
        component.conferenceId = '12345';
        component.setupSubscribers();
        mockEventService.messageSubject.next(new InstantMessage({
            conferenceId: '12345', from: 'james.green123@hearings.net'
        }));

        expect(component.unreadCount).toBe(unreadCountResponse.number_of_unread_messages);
    });
});
