import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdalService } from 'adal-angular4';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { MockAdalService } from 'src/app/testing/mocks/MockAdalService';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { MockVideoWebService } from 'src/app/testing/mocks/MockVideoService';
import { VhoChatComponent } from './vho-chat.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { EventsService } from 'src/app/services/events.service';
import { MockEventsService } from 'src/app/testing/mocks/MockEventService';
import { ChatResponse } from 'src/app/services/clients/api-client';
import { configureTestSuite } from 'ng-bullet';
import { ProfileService } from 'src/app/services/api/profile.service';
import { MockProfileService } from 'src/app/testing/mocks/MockProfileService';
import { Guid } from 'guid-typescript';

describe('VhoChatComponent', () => {
    let component: VhoChatComponent;
    let fixture: ComponentFixture<VhoChatComponent>;
    let eventService: MockEventsService;
    let adalService: MockAdalService;
    let profileService: MockProfileService;
    const conference = new ConferenceTestData().getConferenceDetail();

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule, ReactiveFormsModule, SharedModule],
            declarations: [VhoChatComponent],
            providers: [
                { provide: AdalService, useClass: MockAdalService },
                { provide: VideoWebService, useClass: MockVideoWebService },
                { provide: ProfileService, useClass: MockProfileService },
                { provide: Logger, useClass: MockLogger },
                { provide: EventsService, useValue: new MockEventsService(true) }
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
        component.messages = new ConferenceTestData().getChatHistory('vho.user@hearings.net');
        spyOn(component, 'updateDivWidthForSection').and.callFake(() => {});
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should send message when send keyboard shortcut is pressed', () => {
        spyOn(eventService, 'sendMessage').and.callFake(() => {
            return Promise.resolve();
        });
        component.newMessageBody.setValue('test');
        const event = new KeyboardEvent('keydown', {
            key: 'Enter'
        });

        component.onKeydown(event);
        expect(eventService.sendMessage).toHaveBeenCalled();
    });

    it('should not send message when validation fails', () => {
        spyOn(eventService, 'sendMessage').and.callFake(() => {
            return Promise.resolve();
        });
        component.newMessageBody.setValue('');
        const event = new KeyboardEvent('keydown', {
            key: 'Enter'
        });

        component.onKeydown(event);
        expect(eventService.sendMessage).toHaveBeenCalledTimes(0);
    });

    it('should not send message when send keyboard shortcut is not pressed ', () => {
        spyOn(eventService, 'sendMessage').and.callFake(() => {
            return Promise.resolve();
        });
        const event = new KeyboardEvent('keydown', {
            shiftKey: true,
            key: 'Enter'
        });

        component.onKeydown(event);
        expect(eventService.sendMessage).toHaveBeenCalledTimes(0);
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

    it('should set from to "You" whem message is from current user', () => {
        const username = conference.participants[0].username;
        adalService.userInfo.userName = username;
        const chatResponse = new ChatResponse({
            id: Guid.create().toString(),
            from: username,
            message: 'test message',
            timestamp: new Date()
        });
        const messageCount = component.messages.length;
        component.handleIncomingMessage(chatResponse);
        expect(chatResponse.is_user).toBeTruthy();
        expect(component.messages.length).toBeGreaterThan(messageCount);
    });

    it('should set from to display name whem message is from other user', async () => {
        const username = conference.participants[0].username;
        const otherUsername = conference.participants[1].username;
        adalService.userInfo.userName = username;
        const chatResponse = new ChatResponse({
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
});
