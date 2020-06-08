import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
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
import { MockProfileService } from 'src/app/testing/mocks/MockProfileService';
import { VhoChatComponent } from './vho-chat.component';
import { Subscription } from 'rxjs';

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
    const imHelper = new ImHelper();

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
        const chatHistory = new ConferenceTestData().getChatHistory(mockAdalService.userInfo.userName, conference.id);

        profileServiceSpy.checkCacheForProfileByUsername.and.callFake(() => null);
        profileServiceSpy.getProfileByUsername.and.returnValue(Promise.resolve(mockProfileService.mockProfile));
        videoWebServiceSpy.getConferenceChatHistory.and.returnValue(Promise.resolve(chatHistory));
        profileServiceSpy.getUserProfile.and.resolveTo(mockProfileService.mockProfile);

        eventsServiceSpy.getChatMessage.and.returnValue(mockEventsService.messageSubject.asObservable());

        component = new VhoChatComponent(videoWebServiceSpy, profileServiceSpy, eventsServiceSpy, new MockLogger(), adalService, imHelper);

        component.hearing = hearing;
        component.participant = hearing.judge;
        component.loggedInUserProfile = mockProfileService.mockProfile;
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
        const instantMessage = new InstantMessage({
            conferenceId: conference.id,
            id: Guid.create().toString(),
            from: adminUsername,
            to: judgeUsername,
            message: 'test message',
            timestamp: new Date()
        });
        mockEventsService.messageSubject.next(instantMessage);
        flushMicrotasks();
        expect(component.handleIncomingMessage).toHaveBeenCalledWith(instantMessage);
    }));

    it('should set from to "You" when message is from current user', async () => {
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
        await component.handleIncomingMessage(instantMessage);
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

    it('should send message to hub', () => {
        const message = 'test';
        component.sendMessage(message);
        expect(eventsServiceSpy.sendMessage).toHaveBeenCalledWith(conference.id, message, component.participant.username);
    });

    it('should use profile from cache', async () => {
        profileServiceSpy.checkCacheForProfileByUsername.and.returnValue(mockProfileService.mockProfile);
        const result = await component.getDisplayNameForSender('vho.user@hearings.net');
        expect(result).toEqual(mockProfileService.mockProfile.first_name);
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
        profileServiceSpy.checkCacheForProfileByUsername.and.returnValue(mockProfileService.mockProfile);
        const result = await component.verifySender(instantMessage);
        expect(result.from_display_name).toEqual(hearing.judge.displayName);
    });
    it('should clear subscription on destroy', async () => {
        const sub = jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']);
        component.chatHubSubscription = sub;
        component.ngOnDestroy();
        expect(component.chatHubSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('should get im history when input has been updated', () => {
        const newParticipant = hearing.participants.filter(x => !x.isJudge)[0];
        component.participant = newParticipant;

        expect(videoWebServiceSpy.getConferenceChatHistory).toHaveBeenCalledWith(hearing.id, newParticipant.username);
    });
});
