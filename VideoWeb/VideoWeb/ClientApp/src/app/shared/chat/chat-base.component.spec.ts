import { ElementRef } from '@angular/core';
import { Guid } from 'guid-typescript';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse, LoggedParticipantResponse, Role } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { ImHelper } from '../im-helper';
import { Hearing } from '../models/hearing';
import { ChatBaseComponent } from './chat-base.component';
import { TranslateService } from '@ngx-translate/core';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { SecurityServiceProvider } from 'src/app/security/authentication/security-provider.service';
import { ISecurityService } from 'src/app/security/authentication/security-service.interface';
import { getSpiedPropertyGetter } from '../jasmine-helpers/property-helpers';
import { of, Subject } from 'rxjs';

class ChatBaseTest extends ChatBaseComponent {
    content: ElementRef<HTMLElement>;
    messagesSent: string[] = [];
    incomingMessages: InstantMessage[] = [];

    constructor(
        protected videoWebService: VideoWebService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected securityServiceProviderService: SecurityServiceProvider,
        protected imHelper: ImHelper,
        protected translateService: TranslateService
    ) {
        super(videoWebService, eventService, logger, securityServiceProviderService, imHelper, translateService);
    }

    get participantUsername(): string {
        return 'participant.unit@hmcts.net';
    }

    get participantId(): string {
        return '1111-1111';
    }

    sendMessage(messageBody: string): void {
        this.messagesSent.push(messageBody);
    }

    handleIncomingOtherMessage(messsage: InstantMessage) {
        this.incomingMessages.push(messsage);
    }
}

describe('ChatBaseComponent', () => {
    let component: ChatBaseComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    const eventsService = eventsServiceSpy;
    let conference: ConferenceResponse;
    let hearing: Hearing;

    let contentElement: HTMLDivElement;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;
    let isAuthenticatedSubject: Subject<boolean>;
    let userDataSubject: Subject<boolean>;
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProvider>;

    beforeAll(() => {
        conference = new ConferenceTestData().getConferenceDetailFuture();
        hearing = new Hearing(conference);
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getConferenceChatHistory',
            'getCurrentParticipant'
        ]);
    });

    beforeEach(() => {
        securityServiceSpy = jasmine.createSpyObj<ISecurityService>('ISecurityService', ['isAuthenticated', 'getUserData']);
        isAuthenticatedSubject = new Subject<boolean>();
        userDataSubject = new Subject<any>();
        securityServiceSpy.isAuthenticated.and.returnValue(isAuthenticatedSubject.asObservable());
        securityServiceSpy.getUserData.and.returnValue(userDataSubject.asObservable());

        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProvider>(
            'SecurityServiceProviderService',
            [],
            ['currentSecurityService$']
        );
        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentSecurityService$').and.returnValue(of(securityServiceSpy));

        component = new ChatBaseTest(
            videoWebServiceSpy,
            eventsService,
            new MockLogger(),
            securityServiceProviderServiceSpy,
            new ImHelper(),
            translateServiceSpy
        );
        contentElement = document.createElement('div');
        component.content = new ElementRef(contentElement);
        component.loggedInUser = new LoggedParticipantResponse({
            participant_id: '1111-1111',
            display_name: 'somename',
            role: Role.Judge,
            admin_username: 'admin@hmcts.net'
        });
    });

    it('should remove message from pending list', () => {
        const instantMessage = new InstantMessage({
            conferenceId: conference.id,
            id: Guid.create().toString(),
            from: 'admin@hmcts.net',
            to: '1111-1111',
            message: 'test message',
            timestamp: new Date()
        });

        component.addMessageToPending(instantMessage);
        expect(component.pendingMessages.size).toBe(1);

        component.removeMessageFromPending(instantMessage);
        expect(component.pendingMessages.size).toBe(1);
        expect(component.pendingMessages.get(instantMessage.to).length).toBe(0);
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
