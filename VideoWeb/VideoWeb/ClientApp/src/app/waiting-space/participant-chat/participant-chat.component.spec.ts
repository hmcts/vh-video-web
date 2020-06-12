import { fakeAsync, tick } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { ImHelper } from 'src/app/shared/im-helper';
import { Hearing } from 'src/app/shared/models/hearing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { ParticipantChatComponent } from './participant-chat.component';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { adminTestProfile, judgeTestProfile } from '../../testing/data/test-profiles';

describe('JudgeChatComponent', () => {
    let component: ParticipantChatComponent;
    let conference: ConferenceResponse;
    let hearing: Hearing;

    let videoWebService: jasmine.SpyObj<VideoWebService>;
    const judgeUsername = judgeTestProfile.username;
    let eventsService: jasmine.SpyObj<EventsService>;
    let profileService: jasmine.SpyObj<ProfileService>;
    const mockAdalService = new MockAdalService();
    const mockEventsService = new MockEventsService();
    let adalService;
    const judgeProfile = judgeTestProfile;
    const adminProfile = adminTestProfile;
    const timer = jasmine.createSpyObj<NodeJS.Timer>('NodeJS.Timer', ['ref', 'unref']);

    beforeAll(() => {
        adalService = mockAdalService;
        conference = new ConferenceTestData().getConferenceDetailFuture();
        hearing = new Hearing(conference);
        videoWebService = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceChatHistory']);
        eventsService = jasmine.createSpyObj<EventsService>('EventsService', ['start', 'getChatMessage', 'sendMessage']);
        profileService = jasmine.createSpyObj<ProfileService>('ProfileService', [
            'checkCacheForProfileByUsername',
            'getProfileByUsername',
            'getUserProfile'
        ]);
    });

    beforeEach(() => {
        spyOn(global, 'setTimeout').and.returnValue(timer);
        adalService.userInfo.userName = judgeUsername;
        const chatHistory = new ConferenceTestData().getChatHistory(mockAdalService.userInfo.userName, conference.id);

        profileService.checkCacheForProfileByUsername.and.returnValue(null);
        profileService.getProfileByUsername.and.resolveTo(adminProfile);
        profileService.getUserProfile.and.resolveTo(judgeProfile);
        videoWebService.getConferenceChatHistory.and.resolveTo(chatHistory);

        eventsService.getChatMessage.and.returnValue(mockEventsService.messageSubject.asObservable());

        component = new ParticipantChatComponent(
            videoWebService,
            profileService,
            eventsService,
            new MockLogger(),
            adalService,
            new ImHelper()
        );
        component.loggedInUserProfile = judgeProfile;
        component.hearing = hearing;
        component.messages = new ConferenceTestData().getChatHistory('vho.user@hearings.net', conference.id);
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should get chat history and subscribe', fakeAsync(() => {
        component.messages = undefined;
        component.ngOnInit();
        tick();
        expect(component.loading).toBeFalsy();
        expect(component.messages.length).toBeGreaterThan(0);
    }));

    it('should toggle show chat state', () => {
        component.showChat = false;

        component.toggleChatDisplay();
        expect(component.showChat).toBeTruthy();

        component.toggleChatDisplay();
        expect(component.showChat).toBeFalsy();
    });

    it('should reset unread counter when chat is opened', () => {
        const mockedDocElement = document.createElement('div');
        document.getElementById = jasmine.createSpy('chat-list').and.returnValue(mockedDocElement);
        spyOn(component, 'scrollToBottom');
        component.unreadMessageCount = 5;
        component.showChat = true;
        component.ngAfterViewChecked();

        expect(component.scrollToBottom).toHaveBeenCalled();
        expect(component.unreadMessageCount).toBe(0);
    });

    it('should increment unread message counter when window is closed', () => {
        const adminUsername = 'admin@user.com';
        component.showChat = false;
        component.unreadMessageCount = 0;
        const message: InstantMessage = new InstantMessage({
            conferenceId: conference.id,
            from: adminUsername,
            from_display_name: 'Admin Test',
            to: conference.participants[1].username,
            id: Guid.create().toString(),
            is_user: false,
            message: 'test auto',
            timestamp: new Date()
        });
        component.handleIncomingOtherMessage(message);
        expect(component.unreadMessageCount).toBeGreaterThan(0);
    });

    it('should not increment unread message counter when window is open', () => {
        const adminUsername = 'admin@user.com';
        component.showChat = true;
        component.unreadMessageCount = 0;
        const message: InstantMessage = new InstantMessage({
            conferenceId: conference.id,
            from: adminUsername,
            from_display_name: 'Admin Test',
            to: conference.participants[1].username,
            id: Guid.create().toString(),
            is_user: false,
            message: 'test auto',
            timestamp: new Date()
        });
        component.handleIncomingOtherMessage(message);
        expect(component.unreadMessageCount).toBe(0);
    });

    it('should call api when local cache does not have user profile', async () => {
        const username = adminProfile.username;
        profileService.checkCacheForProfileByUsername.and.returnValue(null);
        const expectedFirstName = adminProfile.first_name;

        const messageInfo = await component.getDisplayNameForSender(username);
        expect(messageInfo).toEqual(expectedFirstName);
    });

    it('should reset unread counter to number of messages since judge replied', () => {
        const messages = new ConferenceTestData().getChatHistory(judgeUsername, conference.id);
        const count = component.getCountSinceUsersLastMessage(messages);
        expect(count).toBe(1);
    });

    it('should reset unread counter to number of messages since user never replied', () => {
        const othername = 'never@sent.com';
        adalService.userInfo.userName = judgeUsername;
        const messages = new ConferenceTestData().getChatHistory(othername, conference.id);
        const count = component.getCountSinceUsersLastMessage(messages);
        expect(count).toBe(messages.length);
    });

    it('should not a messsage to the chat list when unique id is already present', () => {
        const messages = new ConferenceTestData().getChatHistory(judgeUsername, conference.id);
        component.messages = Object.assign([], messages);
        const duplicateMessage = messages[messages.length - 1];
        component.handleIncomingMessage(duplicateMessage);

        expect(component.messages.length).toBe(messages.length);
    });

    it('should ignore message if for another conference', () => {
        const messages = new ConferenceTestData().getChatHistory(judgeUsername, conference.id);
        component.messages = Object.assign([], messages);
        const newIm = messages[messages.length - 1];
        newIm.conferenceId = Guid.create().toString();
        component.handleIncomingMessage(newIm);

        expect(component.messages.length).toBe(messages.length);
    });

    it('should map to InstantMessage', async () => {
        const messages = await component.retrieveChatForConference(judgeUsername);
        const messagesWithId = messages.filter(x => x.id);
        expect(messagesWithId.length).toBe(messages.length);
    });

    it('should send message to hub', async () => {
        const message = 'test';
        await component.sendMessage(message);
        expect(eventsService.sendMessage.calls.mostRecent().args[0]).toBeInstanceOf(InstantMessage);
        const lastArg = <InstantMessage>eventsService.sendMessage.calls.mostRecent().args[0];
        expect(lastArg.conferenceId).toBe(conference.id);
        expect(lastArg.message).toBe(message);
        expect(lastArg.to).toBe(component.DEFAULT_ADMIN_USERNAME);
    });
});
