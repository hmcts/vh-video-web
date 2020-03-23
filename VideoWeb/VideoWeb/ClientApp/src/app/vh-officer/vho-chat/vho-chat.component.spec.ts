import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdalService } from 'adal-angular4';
import { Guid } from 'guid-typescript';
import { configureTestSuite } from 'ng-bullet';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { MockProfileService } from 'src/app/testing/mocks/MockProfileService';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { ChatInputBoxStubComponent } from 'src/app/testing/stubs/chat-input-box-stub.component';
import { VhoChatComponent } from './vho-chat.component';

describe('VhoChatComponent', () => {
    let component: VhoChatComponent;
    let fixture: ComponentFixture<VhoChatComponent>;
    let eventService: MockEventsService;
    let adalService: MockAdalService;
    let profileService: MockProfileService;
    const conference = new ConferenceTestData().getConferenceDetailFuture();

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            declarations: [VhoChatComponent, ChatInputBoxStubComponent],
            providers: [
                { provide: AdalService, useClass: MockAdalService },
                { provide: VideoWebService, useClass: MockVideoWebService },
                { provide: ProfileService, useClass: MockProfileService },
                { provide: Logger, useClass: MockLogger },
                { provide: EventsService, useValue: new MockEventsService() }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        eventService = TestBed.get(EventsService);
        adalService = TestBed.get(AdalService);
        profileService = TestBed.get(ProfileService);
        fixture = TestBed.createComponent(VhoChatComponent);
        component = fixture.componentInstance;
        component.conference = conference;
        component.messages = new ConferenceTestData().getChatHistory('vho.user@hearings.net', conference.id);
        spyOn(component, 'updateDivWidthForSection').and.callFake(() => {});
        fixture.detectChanges();
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
        await fixture.whenStable();
        const username = 'vhofficer.hearings.net';
        const expectedFirstName = profileService.mockProfile.first_name;
        const from = await component.assignMessageFrom(username);
        expect(from).toBe(expectedFirstName);
    });

    it('should send message to hub', () => {
        spyOn(eventService, 'sendMessage');
        const message = 'test';
        component.sendMessage(message);
        expect(eventService.sendMessage).toHaveBeenCalledWith(conference.id, message);
    });
});
