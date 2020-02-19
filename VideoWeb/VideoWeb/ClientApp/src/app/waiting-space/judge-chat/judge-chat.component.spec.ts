import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdalService } from 'adal-angular4';
import { configureTestSuite } from 'ng-bullet';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { MockProfileService } from 'src/app/testing/mocks/MockProfileService';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { JudgeChatComponent } from './judge-chat.component';

describe('JudgeChatComponent', () => {
    let component: JudgeChatComponent;
    let fixture: ComponentFixture<JudgeChatComponent>;
    let eventService: MockEventsService;
    let adalService: MockAdalService;
    let profileService: MockProfileService;
    const conference = new ConferenceTestData().getConferenceDetail();
    const judgeUsername = 'judge.fudge@hearings.net';

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule, ReactiveFormsModule, SharedModule],
            declarations: [JudgeChatComponent],
            providers: [
                { provide: AdalService, useClass: MockAdalService },
                { provide: VideoWebService, useClass: MockVideoWebService },
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
        component.messages = new ConferenceTestData().getChatHistory(judgeUsername);
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

    it('should clear field when message has been sent', async done => {
        await fixture.whenStable();
        const messageBody = 'test body';
        component.newMessageBody.setValue(messageBody);
        spyOn(eventService, 'sendMessage');
        component.sendMessage();

        expect(component.newMessageBody.value).toBeNull();
        expect(eventService.sendMessage).toHaveBeenCalled();
        done();
    });

    it('should get first name when message from user not in conference', async () => {
        await fixture.whenStable();
        const username = 'vhofficer.hearings.net';
        const expectedFirstName = profileService.mockProfile.first_name;
        const from = await component.assignMessageFrom(username);
        expect(from).toBe(expectedFirstName);
    });

    it('should reset unread counter to number of messages since judge replied', () => {
        const messages = new ConferenceTestData().getChatHistory(judgeUsername);
        const count = component.getCountSinceUsersLastMessage(messages);
        expect(count).toBe(1);
    });

    it('should reset unread counter to number of messages since user never replied', () => {
        const othername = 'never@sent.com';
        adalService.userInfo.userName = judgeUsername;
        const messages = new ConferenceTestData().getChatHistory(othername);
        const count = component.getCountSinceUsersLastMessage(messages);
        expect(count).toBe(messages.length);
    });
});
