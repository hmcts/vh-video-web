import { fakeAsync, flush, flushMicrotasks, tick } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { of, Subject, Subscription } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse, LoggedParticipantResponse, Role } from 'src/app/services/clients/api-client';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { ImHelper } from 'src/app/shared/im-helper';
import { Hearing } from 'src/app/shared/models/hearing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy, messageSubjectMock } from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { VhoChatComponent } from './vho-chat.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { SecurityServiceProvider } from 'src/app/security/authentication/security-provider.service';
import { ISecurityService } from 'src/app/security/authentication/security-service.interface';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { IdpProviders } from 'src/app/security/idp-providers';
import { adminTestProfile } from 'src/app/testing/data/test-profiles';

describe('VhoChatComponent', () => {
    let component: VhoChatComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    const eventsService = eventsServiceSpy;
    let conference: ConferenceResponse;
    let hearing: Hearing;
    const adminProfile = adminTestProfile;
    const timer = jasmine.createSpyObj<NodeJS.Timeout>('NodeJS.Timeout', ['ref', 'unref']);
    let chatSub$: Subscription;
    let securityServiceSpy: jasmine.SpyObj<ISecurityService>;
    let isAuthenticatedSubject: Subject<boolean>;
    let userDataSubject: Subject<any>;
    let securityServiceProviderServiceSpy: jasmine.SpyObj<SecurityServiceProvider>;

    beforeAll(() => {
        conference = new ConferenceTestData().getConferenceDetailFuture();
        hearing = new Hearing(conference);
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getConferenceChatHistory',
            'getCurrentParticipant'
        ]);
    });

    afterAll(() => {
        component.ngOnDestroy();
    });

    beforeEach(() => {
        spyOn(global, 'setTimeout').and.returnValue(<any>timer);
        const chatHistory = new ConferenceTestData().getChatHistory(adminProfile.username, conference.id);
        const loggedParticipant = new LoggedParticipantResponse({
            participant_id: null,
            admin_username: 'admin@hmcts.net',
            role: Role.VideoHearingsOfficer
        });

        videoWebServiceSpy.getConferenceChatHistory.and.returnValue(Promise.resolve(chatHistory));
        videoWebServiceSpy.getCurrentParticipant.and.returnValue(Promise.resolve(loggedParticipant));

        securityServiceSpy = jasmine.createSpyObj<ISecurityService>('ISecurityService', ['isAuthenticated', 'getUserData']);
        isAuthenticatedSubject = new Subject<boolean>();
        userDataSubject = new Subject<any>();
        securityServiceSpy.isAuthenticated.and.returnValue(isAuthenticatedSubject.asObservable());
        securityServiceSpy.getUserData.and.returnValue(userDataSubject.asObservable());

        isAuthenticatedSubject.next(true);
        userDataSubject.next({ preferred_username: adminProfile.username });

        securityServiceProviderServiceSpy = jasmine.createSpyObj<SecurityServiceProvider>(
            'SecurityServiceProviderService',
            [],
            ['currentSecurityService$', 'currentIdp$']
        );
        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentSecurityService$').and.returnValue(of(securityServiceSpy));
        getSpiedPropertyGetter(securityServiceProviderServiceSpy, 'currentIdp$').and.returnValue(of(IdpProviders.vhaad));

        component = new VhoChatComponent(
            videoWebServiceSpy,
            eventsService,
            new MockLogger(),
            securityServiceProviderServiceSpy,
            new ImHelper(),
            translateServiceSpy
        );

        component.hearing = hearing;
        component.participant = hearing.judge;
        component.loggedInUserProfile = adminProfile;
        component.messages = new ConferenceTestData().getChatHistory(adminTestProfile.username, conference.id);
        component.loggedInUser = new LoggedParticipantResponse({
            display_name: 'somename',
            role: Role.VideoHearingsOfficer,
            admin_username: 'admin@hmcts.net'
        });
    });

    afterEach(() => {
        if (chatSub$) {
            chatSub$.unsubscribe();
        }
    });

    it('should get chat history and subscribe', fakeAsync(async () => {
        component.loggedInUserProfile = undefined;

        component.ngOnInit();
        flushMicrotasks();

        expect(component.newMessageBody).toBeDefined();
        expect(component.loggedInUser).toBeDefined();
        expect(component.newMessageBody.pristine).toBeTruthy();
        expect(component.loading).toBeFalsy();
        expect(component.messages.length).toBeGreaterThan(0);
    }));

    it('should handle message when received from admin', fakeAsync(async () => {
        chatSub$ = await component.setupChatSubscription();
        spyOn(component, 'handleIncomingMessage');
        const judgeId = hearing.judge.id;
        const adminUsername = 'admin@hmcts.net';
        component.loggedInUser = null;

        component.ngOnInit();
        userDataSubject.next({ preferred_username: adminProfile.username });
        flush();

        const instantMessageTest = new InstantMessage({
            conferenceId: conference.id,
            id: Guid.create().toString(),
            from: adminUsername,
            to: judgeId,
            message: 'test message',
            timestamp: new Date()
        });
        component.pendingMessages.set(instantMessageTest.to, []);
        component.addMessageToPending(instantMessageTest);
        messageSubjectMock.next(instantMessageTest);
        expect(component.loggedInUser).toBeDefined();
        expect(component.loggedInUser.role).toBe(Role.VideoHearingsOfficer);

        tick();
        expect(component.handleIncomingMessage).toHaveBeenCalledWith(instantMessageTest);
    }));

    it('should set from to "You" when admin send a message to participant', fakeAsync(async () => {
        chatSub$ = await component.setupChatSubscription();
        const judgeUsername = hearing.judge.id;
        const adminUsername = 'admin@hmcts.net';
        const instantMessage = new InstantMessage({
            conferenceId: conference.id,
            id: Guid.create().toString(),
            from: adminUsername,
            to: judgeUsername,
            message: 'test message',
            timestamp: new Date()
        });
        const loggedInUser = new LoggedParticipantResponse({
            participant_id: null,
            display_name: 'somename',
            role: Role.VideoHearingsOfficer,
            admin_username: 'admin@hmcts.net'
        });
        videoWebServiceSpy.getCurrentParticipant.and.returnValue(Promise.resolve(loggedInUser));

        const messageCount = component.messages.length;
        messageSubjectMock.next(instantMessage);
        flushMicrotasks();

        userDataSubject.next({ preferred_username: loggedInUser.admin_username });
        flush();

        const afterCount = component.messages.length;
        expect(component.messages.pop().is_user).toBeTruthy();
        expect(afterCount).toBeGreaterThan(messageCount);
    }));

    it('should not add message participant B send message to admin when chat for participant A is open', fakeAsync(async () => {
        chatSub$ = await component.setupChatSubscription();
        const otherUsername = '12345-1234';
        const adminUsername = 'admin@hmcts.net';

        const im = new InstantMessage({
            conferenceId: conference.id,
            id: Guid.create().toString(),
            from: otherUsername,
            to: adminUsername,
            message: 'test message',
            timestamp: new Date()
        });
        const loggedInUser = new LoggedParticipantResponse({
            participant_id: null,
            display_name: 'somename',
            role: Role.VideoHearingsOfficer,
            admin_username: 'admin@hmcts.net'
        });
        videoWebServiceSpy.getCurrentParticipant.and.returnValue(Promise.resolve(loggedInUser));

        flushMicrotasks();
        const messageCount = component.messages.length;

        messageSubjectMock.next(im);

        flushMicrotasks();
        expect(component.messages.length).toBe(messageCount);
    }));

    it('should send message to hub', async () => {
        const message = 'test';
        await component.sendMessage(message);
        expect(eventsService.sendMessage.calls.mostRecent().args[0]).toBeInstanceOf(InstantMessage);
        const lastArg = <InstantMessage>eventsService.sendMessage.calls.mostRecent().args[0];
        expect(lastArg.conferenceId).toBe(conference.id);
        expect(lastArg.message).toBe(message);
        expect(lastArg.to).toBe(component.participant.id);
        expect(component.disableScrollDown).toBeFalse();
    });

    it('should clear subscription on destroy', async () => {
        component.chatHubSubscription = jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']);
        component.ngOnDestroy();
        expect(component.chatHubSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('should get im history when input has been updated', () => {
        const newParticipant = hearing.participants.filter(x => !x.isJudge)[0];
        component.participant = newParticipant;

        expect(videoWebServiceSpy.getConferenceChatHistory).toHaveBeenCalledWith(hearing.id, newParticipant.id);
    });

    it('should scroll to bottom of chat window after view has been checked', () => {
        spyOn(component, 'scrollToBottom');
        component.ngAfterViewChecked();
        expect(component.scrollToBottom).toHaveBeenCalled();
    });

    it('should update failed property if im has not sent after 3 seconds', () => {
        const judgeUsername = hearing.judge.id;
        const adminUsername = 'admin@hmcts.net';
        const instantMessage = new InstantMessage({
            conferenceId: conference.id,
            id: Guid.create().toString(),
            from: adminUsername,
            to: judgeUsername,
            message: 'test message',
            timestamp: new Date()
        });
        component.loggedInUser = new LoggedParticipantResponse({
            participant_id: null,
            display_name: 'somename',
            role: Role.VideoHearingsOfficer,
            admin_username: adminUsername
        });
        component.addMessageToPending(instantMessage);
        component.checkIfMessageFailed(instantMessage);
        const result = component.pendingMessagesForConversation.pop();
        expect(result.failedToSend).toBeTruthy();
    });
    it('should not update failed property if im could not be found', () => {
        const judgeUsername = hearing.judge.id;
        const adminUsername = 'admin@hmcts.net';
        const instantMessage = new InstantMessage({
            conferenceId: conference.id,
            id: Guid.create().toString(),
            from: adminUsername,
            to: judgeUsername,
            message: 'test message',
            timestamp: new Date()
        });
        const instantMessage1 = new InstantMessage({
            conferenceId: conference.id,
            id: Guid.create().toString(),
            from: adminUsername,
            to: judgeUsername,
            message: 'test message',
            timestamp: new Date()
        });
        component.loggedInUser = new LoggedParticipantResponse({
            participant_id: null,
            display_name: 'somename',
            role: Role.VideoHearingsOfficer,
            admin_username: adminUsername
        });

        component.addMessageToPending(instantMessage1);
        component.checkIfMessageFailed(instantMessage);
        const result = component.pendingMessagesForConversation.pop();
        expect(result.failedToSend).toBeFalsy();
    });

    it('should handle pending IMs already processed', () => {
        const judgeUsername = hearing.judge.id;
        const adminUsername = 'admin@hmcts.net';
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
        expect(component.pendingMessagesForConversation.length).toBe(0);
    });
});
