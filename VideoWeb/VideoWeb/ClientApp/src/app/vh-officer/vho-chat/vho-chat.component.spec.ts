import { Guid } from 'guid-typescript';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { VhoChatComponent } from './vho-chat.component';
import { MockProfileService } from 'src/app/testing/mocks/MockProfileService';

describe('VhoChatComponent', () => {
    let component: VhoChatComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let eventsServiceSpy: jasmine.SpyObj<EventsService>;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    const mockProfileService = new MockProfileService();
    const mockAdalService = new MockAdalService();
    let adalService;
    let conference: ConferenceResponse;

    beforeAll(() => {
        adalService = mockAdalService;
        conference = new ConferenceTestData().getConferenceDetailFuture();
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceChatHistory']);
        eventsServiceSpy = jasmine.createSpyObj<EventsService>('EventsService', ['sendMessage']);
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', [
            'checkCacheForProfileByUsername',
            'getProfileByUsername'
        ]);
    });

    beforeEach(() => {
        const chatHistory = new ConferenceTestData().getChatHistory(mockAdalService.userInfo.userName, conference.id);

        profileServiceSpy.checkCacheForProfileByUsername.and.callFake(() => null);
        profileServiceSpy.getProfileByUsername.and.returnValue(Promise.resolve(mockProfileService.mockProfile));
        videoWebServiceSpy.getConferenceChatHistory.and.returnValue(Promise.resolve(chatHistory));

        component = new VhoChatComponent(videoWebServiceSpy, profileServiceSpy, eventsServiceSpy, new MockLogger(), adalService);

        component.conference = conference;
        component.messages = new ConferenceTestData().getChatHistory('vho.user@hearings.net', conference.id);
        spyOn(component, 'updateDivWidthForSection').and.callFake(() => {});
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set from to "You" whem message is from current user', () => {
        const username = conference.participants[0].username;
        adalService.userInfo.userName = username;
        const instantMessage = new InstantMessage({
            conferenceId: conference.id,
            id: Guid.create().toString(),
            from: username,
            message: 'test message',
            timestamp: new Date()
        });
        const messageCount = component.messages.length;
        component.handleIncomingMessage(instantMessage);
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
            timestamp: new Date()
        });
        const messageCount = component.messages.length;
        await component.handleIncomingMessage(chatResponse);
        expect(chatResponse.is_user).toBeFalsy();
        expect(component.messages.length).toBeGreaterThan(messageCount);
    });

    it('should get first name when message from user not in conference', async () => {
        const username = 'vhofficer.hearings.net';
        const expectedFirstName = mockProfileService.mockProfile.first_name;
        const from = await component.assignMessageFrom(username);
        expect(from).toBe(expectedFirstName);
    });

    it('should send message to hub', () => {
        const message = 'test';
        component.sendMessage(message);
        expect(eventsServiceSpy.sendMessage).toHaveBeenCalledWith(conference.id, message);
    });
});
