import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { Subscription } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { ImHelper } from 'src/app/shared/im-helper';
import { Hearing } from 'src/app/shared/models/hearing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { adminTestProfile, judgeTestProfile } from '../../testing/data/test-profiles';
import { VhoChatComponent } from './vho-chat.component';

describe('VhoChatComponent', () => {
    let component: VhoChatComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let eventsServiceSpy: jasmine.SpyObj<EventsService>;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    const mockAdalService = new MockAdalService();
    const mockEventsService = new MockEventsService();
    let adalService;
    let conference: ConferenceResponse;
    let hearing: Hearing;
    const judgeProfile = judgeTestProfile;
    const adminProfile = adminTestProfile;
    const timer = jasmine.createSpyObj<NodeJS.Timer>('NodeJS.Timer', ['ref', 'unref']);

    beforeAll(() => {
        adalService = mockAdalService;
        conference = new ConferenceTestData().getConferenceDetailFuture();
        hearing = new Hearing(conference);
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceChatHistory']);
        eventsServiceSpy = jasmine.createSpyObj<EventsService>('EventsService', ['start', 'getChatMessage', 'sendMessage']);
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', [
            'checkCacheForProfileByUsername',
            'getProfileByUsername',
            'getUserProfile'
        ]);
    });

    afterAll(() => {
        component.ngOnDestroy();
    });

    beforeEach(() => {
        spyOn(global, 'setTimeout').and.returnValue(timer);
        const chatHistory = new ConferenceTestData().getChatHistory(mockAdalService.userInfo.userName, conference.id);

        profileServiceSpy.checkCacheForProfileByUsername.and.callFake(() => null);
        profileServiceSpy.getProfileByUsername.and.returnValue(Promise.resolve(judgeProfile));
        videoWebServiceSpy.getConferenceChatHistory.and.returnValue(Promise.resolve(chatHistory));
        profileServiceSpy.getUserProfile.and.resolveTo(adminProfile);

        eventsServiceSpy.getChatMessage.and.returnValue(mockEventsService.messageSubject.asObservable());

        component = new VhoChatComponent(
            videoWebServiceSpy,
            profileServiceSpy,
            eventsServiceSpy,
            new MockLogger(),
            adalService,
            new ImHelper()
        );

        component.hearing = hearing;
        component.participant = hearing.judge;
        component.loggedInUserProfile = adminProfile;
        component.messages = new ConferenceTestData().getChatHistory('vho.user@hearings.net', conference.id);
    });

    it('should get chat history and subscribe', fakeAsync(() => {
        component.loggedInUserProfile = undefined;
        component.ngOnInit();
        flushMicrotasks();
        expect(component.newMessageBody).toBeDefined();
        expect(component.loggedInUserProfile).toBeDefined();
        expect(component.newMessageBody.pristine).toBeTruthy();
        expect(component.loading).toBeFalsy();
        expect(component.messages.length).toBeGreaterThan(0);
    }));

    it('should handle message when received from admin', fakeAsync(() => {
        component.setupChatSubscription();
        spyOn(component, 'handleIncomingMessage');
        const judgeUsername = hearing.judge.username;
        const adminUsername = 'admin@test.com';
        adalService.userInfo.userName = judgeUsername;
        const instantMessageTest = new InstantMessage({
            conferenceId: conference.id,
            id: Guid.create().toString(),
            from: adminUsername,
            to: judgeUsername,
            message: 'test message',
            timestamp: new Date()
        });
        component.pendingMessages.push(instantMessageTest);
        mockEventsService.messageSubject.next(instantMessageTest);
        expect(component.handleIncomingMessage).toHaveBeenCalledWith(instantMessageTest);
    }));

    it('should set from to "You" when admin send a message to participant', async () => {
        const judgeUsername = hearing.judge.username;
        const adminUsername = 'admin@test.com';
        const instantMessage = new InstantMessage({
            conferenceId: conference.id,
            id: Guid.create().toString(),
            from: judgeUsername,
            to: adminUsername,
            message: 'test message',
            timestamp: new Date()
        });
        const messageCount = component.messages.length;
        component.pendingMessages.push(instantMessage);
        await component.handleIncomingMessage(instantMessage);
        expect(component.pendingMessages.length).toBe(0);
        expect(instantMessage.is_user).toBeTruthy();
        expect(component.messages.length).toBeGreaterThan(messageCount);
    });

    it('should set from to display name whem message is from other user', async () => {
        const username = conference.participants[0].username;
        const otherUsername = component.DEFAULT_ADMIN_USERNAME;
        adalService.userInfo.userName = username;
        const chatResponse = new InstantMessage({
            conferenceId: conference.id,
            id: Guid.create().toString(),
            from: otherUsername,
            message: 'test message',
            timestamp: new Date()
        });
        const messageCount = component.messages.length;
        await component.handleIncomingMessage(chatResponse);
        expect(chatResponse.is_user).toBeFalsy();
        expect(component.messages.length).toBeGreaterThan(messageCount);
    });

    it('should send message to hub', async () => {
        const message = 'test';
        await component.sendMessage(message);
        expect(eventsServiceSpy.sendMessage.calls.mostRecent().args[0]).toBeInstanceOf(InstantMessage);
        const lastArg = <InstantMessage>eventsServiceSpy.sendMessage.calls.mostRecent().args[0];
        expect(lastArg.conferenceId).toBe(conference.id);
        expect(lastArg.message).toBe(message);
        expect(lastArg.to).toBe(component.participant.username);
    });

    it('should use profile from cache', async () => {
        profileServiceSpy.checkCacheForProfileByUsername.and.returnValue(judgeProfile);
        const result = await component.getDisplayNameForSender(judgeProfile.username);
        expect(result).toEqual(judgeProfile.display_name);
    });

    it('should use participant name when message is not from admin', async () => {
        const judgeUsername = hearing.judge.username;
        const adminUsername = 'admin@test.com';
        adalService.userInfo.userName = judgeUsername;
        const instantMessage = new InstantMessage({
            conferenceId: conference.id,
            id: Guid.create().toString(),
            from: judgeUsername,
            to: adminUsername,
            message: 'test message',
            timestamp: new Date()
        });
        profileServiceSpy.checkCacheForProfileByUsername.and.returnValue(judgeProfile);
        const result = await component.verifySender(instantMessage);
        expect(result.from_display_name).toEqual(hearing.judge.displayName);
    });

    it('should clear subscription on destroy', async () => {
        component.chatHubSubscription = jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']);
        component.ngOnDestroy();
        expect(component.chatHubSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('should get im history when input has been updated', () => {
        const newParticipant = hearing.participants.filter(x => !x.isJudge)[0];
        component.participant = newParticipant;

        expect(videoWebServiceSpy.getConferenceChatHistory).toHaveBeenCalledWith(hearing.id, newParticipant.username);
    });

    it('should scroll to bottom of chat window after view has been checked', () => {
        spyOn(component, 'scrollToBottom');
        component.ngAfterViewChecked();
        expect(component.scrollToBottom).toHaveBeenCalled();
    });

    it('should update failed property if im has not sent after 3 seconds', () => {
        const judgeUsername = hearing.judge.username;
        const adminUsername = 'admin@test.com';
        adalService.userInfo.userName = adminUsername;
        const instantMessage = new InstantMessage({
            conferenceId: conference.id,
            id: Guid.create().toString(),
            from: judgeUsername,
            to: adminUsername,
            message: 'test message',
            timestamp: new Date()
        });

        component.pendingMessages.push(instantMessage);
        component.checkIfMessageFailed(instantMessage);
        const result = component.pendingMessages.pop();
        expect(result.failedToSend).toBeTruthy();
    });

    it('should handle pending IMs already processed', () => {
        const judgeUsername = hearing.judge.username;
        const adminUsername = 'admin@test.com';
        adalService.userInfo.userName = adminUsername;
        const im = new InstantMessage({
            conferenceId: conference.id,
            id: Guid.create().toString(),
            from: judgeUsername,
            to: adminUsername,
            message: 'test message',
            timestamp: new Date()
        });
        component.messages.push(im);
        component.checkIfMessageFailed(im);
        expect(component.pendingMessages.length).toBe(0);
    });
});
