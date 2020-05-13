import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { UnreadMessagesComponent } from './unread-messages.component';
import { EventsService } from 'src/app/services/events.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { UnreadAdminMessageResponse } from 'src/app/services/clients/api-client';
import { Guid } from 'guid-typescript';

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
        eventsService = jasmine.createSpyObj<EventsService>('EventsService', ['start', 'getAdminAnsweredChat']);

        eventsService.getAdminAnsweredChat.and.returnValue(mockEventService.adminAnsweredChatSubject.asObservable());

        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getUnreadAdminMessageCountForConference']);
        videoWebServiceSpy.getUnreadAdminMessageCountForConference.and.callFake(() => Promise.resolve(unreadCountResponse));

        logger = new MockLogger();
    });

    beforeEach(() => {
        component = new UnreadMessagesComponent(videoWebServiceSpy, eventsService, logger);
        component.conferenceId = conference.id;
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
        const error = { error: 'failed to find conference', error_code: 404 };
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
});
