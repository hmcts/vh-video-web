import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdalService } from 'adal-angular4';
import { Guid } from 'guid-typescript';
import { configureTestSuite } from 'ng-bullet';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { MockProfileService } from 'src/app/testing/mocks/MockProfileService';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { ChatInputBoxStubComponent } from 'src/app/testing/stubs/chat-input-box-stub.component';
import { JudgeChatComponent } from './judge-chat.component';

describe('JudgeChatComponent', () => {
    let component: JudgeChatComponent;
    let fixture: ComponentFixture<JudgeChatComponent>;
    let eventService: MockEventsService;
    let adalService: MockAdalService;
    let profileService: MockProfileService;
    const conference = new ConferenceTestData().getConferenceDetail();
    const judgeUsername = 'judge.fudge@hearings.net';
    const videoWebService = new MockVideoWebService();
    videoWebService.username = judgeUsername;

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            declarations: [JudgeChatComponent, ChatInputBoxStubComponent],
            providers: [
                { provide: AdalService, useClass: MockAdalService },
                { provide: VideoWebService, useValue: videoWebService },
                { provide: ProfileService, useClass: MockProfileService },
                { provide: Logger, useClass: MockLogger },
                { provide: EventsService, useClass: MockEventsService }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        eventService = TestBed.get(EventsService);
        adalService = TestBed.get(AdalService);
        profileService = TestBed.get(ProfileService);

        adalService.userInfo.userName = judgeUsername;

        fixture = TestBed.createComponent(JudgeChatComponent);
        component = fixture.componentInstance;
        component.conference = conference;
        component.messages = new ConferenceTestData().getChatHistory(judgeUsername, conference.id);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

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

        component.unreadMessageCount = 5;
        component.showChat = true;
        component.ngAfterViewChecked();

        expect(component.unreadMessageCount).toBe(0);
    });

    it('should increment unread message counter when window is closed', () => {
        component.showChat = false;
        component.unreadMessageCount = 0;
        component.handleIncomingOtherMessage();
        expect(component.unreadMessageCount).toBeGreaterThan(0);
    });

    it('should not increment unread message counter when window is open', () => {
        component.showChat = true;
        component.unreadMessageCount = 0;
        component.handleIncomingOtherMessage();
        expect(component.unreadMessageCount).toBe(0);
    });

    it('should get first name when message from user not in conference', async () => {
        await fixture.whenStable();
        const username = 'vhofficer.hearings.net';
        const expectedFirstName = profileService.mockProfile.first_name;
        const from = await component.assignMessageFrom(username);
        expect(from).toBe(expectedFirstName);
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
        const messages = await component.retrieveChatForConference();
        const messagesWithId = messages.filter(x => x.id);
        console.log(messagesWithId);
        expect(messagesWithId.length).toBe(messages.length);
    });

    it('should send message to hub', () => {
        spyOn(eventService, 'sendMessage');
        const message = 'test';
        component.sendMessage(message);
        expect(eventService.sendMessage).toHaveBeenCalledWith(conference.id, message);
    });
});
