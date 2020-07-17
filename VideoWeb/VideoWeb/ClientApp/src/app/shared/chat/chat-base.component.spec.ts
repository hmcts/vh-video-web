import { ElementRef } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { Guid } from 'guid-typescript';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { adminTestProfile } from 'src/app/testing/data/test-profiles';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { ImHelper } from '../im-helper';
import { Hearing } from '../models/hearing';
import { ChatBaseComponent } from './chat-base.component';

class ChatBaseTest extends ChatBaseComponent {
    content: ElementRef<HTMLElement>;
    messagesSent: string[] = [];
    incomingMessages: InstantMessage[] = [];

    constructor(
        protected videoWebService: VideoWebService,
        protected profileService: ProfileService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected adalService: AdalService,
        protected imHelper: ImHelper
    ) {
        super(videoWebService, profileService, eventService, logger, adalService, imHelper);
    }

    sendMessage(messageBody: string): void {
        this.messagesSent.push(messageBody);
    }
    get participantUsername(): string {
        return 'participant.unit@test.com';
    }
    handleIncomingOtherMessage(messsage: InstantMessage) {
        this.incomingMessages.push(messsage);
    }
}

describe('ChatBaseComponent', () => {
    let component: ChatBaseComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    const eventsService = eventsServiceSpy;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let adalService: jasmine.SpyObj<AdalService>;
    let conference: ConferenceResponse;
    let hearing: Hearing;
    const adminProfile = adminTestProfile;
    let contentElement: HTMLDivElement;

    beforeAll(() => {
        adalService = jasmine.createSpyObj<AdalService>('AdalService', ['init', 'handleWindowCallback', 'userInfo', 'logOut'], {
            userInfo: <adal.User>{ userName: adminProfile.username, authenticated: true }
        });
        conference = new ConferenceTestData().getConferenceDetailFuture();
        hearing = new Hearing(conference);
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getConferenceChatHistory']);
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', [
            'checkCacheForProfileByUsername',
            'getProfileByUsername',
            'getUserProfile'
        ]);
    });

    beforeEach(() => {
        component = new ChatBaseTest(videoWebServiceSpy, profileServiceSpy, eventsService, new MockLogger(), adalService, new ImHelper());
        contentElement = document.createElement('div');
        component.content = new ElementRef(contentElement);
    });

    it('should remove message from pending list', () => {
        const instantMessage = new InstantMessage({
            conferenceId: conference.id,
            id: Guid.create().toString(),
            from: 'admin@test.com',
            to: component.participantUsername,
            message: 'test message',
            timestamp: new Date()
        });

        component.addMessageToPending(instantMessage);
        expect(component.pendingMessagesForConversation.length).toBe(1);
        component.removeMessageFromPending(instantMessage);
        expect(component.pendingMessagesForConversation.length).toBe(0);
    });

    it('should not disable scroll to bottom', () => {
        component.disableScrollDown = true;
        component.onScroll();
        expect(component.disableScrollDown).toBeFalsy();
    });

    it('should disable scroll to bottom', () => {
        component.disableScrollDown = false;
        component.onScroll();
        expect(component.disableScrollDown).toBeTruthy();
    });

    it('should not scroll to bottom when disabled', () => {
        component.disableScrollDown = true;
        let hasScrolled = false;
        spyOnProperty(component.content.nativeElement, 'scrollTop', 'set').and.callFake(() => (hasScrolled = true));
        spyOnProperty(component.content.nativeElement, 'scrollHeight', 'get').and.returnValue(100);
        component.scrollToBottom();
        expect(hasScrolled).toBeFalsy();
    });
});
