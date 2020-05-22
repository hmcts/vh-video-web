import { fakeAsync, tick, flush, flushMicrotasks } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { InstantMessage, ExtendMessageInfo } from 'src/app/services/models/instant-message';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { MockProfileService } from 'src/app/testing/mocks/MockProfileService';
import { VhoChatComponent } from './vho-chat.component';
import { Hearing } from 'src/app/shared/models/hearing';

describe('VhoChatComponent', () => {
    let component: VhoChatComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let eventsServiceSpy: jasmine.SpyObj<EventsService>;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    const mockProfileService = new MockProfileService();
    const mockAdalService = new MockAdalService();
    const mockEventsService = new MockEventsService();
    let adalService;
    let conference: ConferenceResponse;
    let hearing: Hearing;

    beforeAll(() => {
        adalService = mockAdalService;
        conference = new ConferenceTestData().getConferenceDetailFuture();
        hearing = new Hearing(conference);
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceChatHistory']);
        eventsServiceSpy = jasmine.createSpyObj<EventsService>('EventsService', ['start', 'getChatMessage', 'sendMessage']);
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', [
            'checkCacheForProfileByUsername',
            'getProfileByUsername'
        ]);
    });

    afterAll(() => {
        component.ngOnDestroy();
    });

    beforeEach(() => {
        const chatHistory = new ConferenceTestData().getChatHistory(mockAdalService.userInfo.userName, conference.id);

        profileServiceSpy.checkCacheForProfileByUsername.and.callFake(() => null);
        profileServiceSpy.getProfileByUsername.and.returnValue(Promise.resolve(mockProfileService.mockProfile));
        videoWebServiceSpy.getConferenceChatHistory.and.returnValue(Promise.resolve(chatHistory));

        eventsServiceSpy.getChatMessage.and.returnValue(mockEventsService.messageSubject.asObservable());

        component = new VhoChatComponent(videoWebServiceSpy, profileServiceSpy, eventsServiceSpy, new MockLogger(), adalService);

        component.hearing = hearing;
        component.messages = new ConferenceTestData().getChatHistory('vho.user@hearings.net', conference.id);
    });

    it('should get chat history and subscribe', fakeAsync(() => {
        component.ngOnInit();
        tick();
        expect(component.newMessageBody).toBeDefined();
        expect(component.newMessageBody.pristine).toBeTruthy();
        expect(component.loading).toBeFalsy();
        expect(component.messages.length).toBeGreaterThan(0);
    }));

    it('should handle message when received', fakeAsync(() => {
        component.setupChatSubscription();
        spyOn(component, 'handleIncomingMessage');
        const username = conference.participants[0].username;
        adalService.userInfo.userName = username;
        const instantMessage = new InstantMessage({
            conferenceId: conference.id,
            id: Guid.create().toString(),
            from: username,
            message: 'test message',
            timestamp: new Date(),
            isJudge: true
        });
        mockEventsService.messageSubject.next(instantMessage);
        flushMicrotasks();
        expect(component.handleIncomingMessage).toHaveBeenCalledWith(instantMessage);
    }));

    it('should set from to "You" whem message is from current user', async () => {
        const username = conference.participants[0].username;
        adalService.userInfo.userName = username;
        const instantMessage = new InstantMessage({
            conferenceId: conference.id,
            id: Guid.create().toString(),
            from: username,
            message: 'test message',
            timestamp: new Date(),
            isJudge: true
        });
        const messageCount = component.messages.length;
        await component.handleIncomingMessage(instantMessage);
        expect(instantMessage.is_user).toBeTruthy();
        expect(component.messages.length).toBeGreaterThan(messageCount);
    });

    it('should set from to display name whem message is from other user', async () => {
        const username = conference.participants[0].username;
        const otherUsername = conference.participants[1].username;
        adalService.userInfo.userName = username;
        const chatResponse = new InstantMessage({
            conferenceId: conference.id,
            id: Guid.create().toString(),
            from: otherUsername,
            message: 'test message',
            timestamp: new Date(),
            isJudge: true
        });
        const messageCount = component.messages.length;
        await component.handleIncomingMessage(chatResponse);
        expect(chatResponse.is_user).toBeFalsy();
        expect(component.messages.length).toBeGreaterThan(messageCount);
    });

    it('should get first name and is Judge flag when message from user not in conference', async () => {
        const username = 'vhofficer.hearings.net';
        const expectedFirstName = mockProfileService.mockProfile.first_name;
        const expectedInfo = new ExtendMessageInfo(expectedFirstName, false);
        const messageInfo = await component.assignMessageFrom(username);
        expect(messageInfo).toEqual(expectedInfo);
    });

    it('should get first name and is Judge flag when message from judge', async () => {
        const username = 'judge.fudge@hearings.net';
        const expectedFirstName = component.hearing.participants[2].displayName;
        const expectedInfo = new ExtendMessageInfo(expectedFirstName, true);
        const messageInfo = await component.assignMessageFrom(username);
        expect(messageInfo).toEqual(expectedInfo);
    });


    it('should send message to hub', () => {
        const message = 'test';
        component.sendMessage(message);
        expect(eventsServiceSpy.sendMessage).toHaveBeenCalledWith(conference.id, message);
    });
});
