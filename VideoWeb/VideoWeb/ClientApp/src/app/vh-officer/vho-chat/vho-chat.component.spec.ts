import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { AdalService } from 'adal-angular4';
import { Guid } from 'guid-typescript';
import { Subscription } from 'rxjs';
import { ProfileService } from 'src/app/services/api/profile.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponse, LoggedParticipantResponse, ParticipantResponse, Role } from 'src/app/services/clients/api-client';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { ImHelper } from 'src/app/shared/im-helper';
import { Hearing } from 'src/app/shared/models/hearing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy, messageSubjectMock } from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { adminTestProfile, judgeTestProfile } from '../../testing/data/test-profiles';
import { VhoChatComponent } from './vho-chat.component';
import { TranslateService } from '@ngx-translate/core';

describe('VhoChatComponent', () => {
    let component: VhoChatComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    const eventsService = eventsServiceSpy;
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;
    let adalService: jasmine.SpyObj<AdalService>;
    let conference: ConferenceResponse;
    let hearing: Hearing;
    const judgeProfile = judgeTestProfile;
    const adminProfile = adminTestProfile;
    const timer = jasmine.createSpyObj<NodeJS.Timeout>('NodeJS.Timeout', ['ref', 'unref']);
    let chatSub$: Subscription;
    let translateServiceSpy: jasmine.SpyObj<TranslateService>;

    beforeAll(() => {
        adalService = jasmine.createSpyObj<AdalService>('AdalService', ['init', 'handleWindowCallback', 'userInfo', 'logOut'], {
            userInfo: <adal.User>{ userName: adminProfile.username, authenticated: true }
        });
        conference = new ConferenceTestData().getConferenceDetailFuture();
        hearing = new Hearing(conference);
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
            'getConferenceChatHistory',
            'getCurrentParticipant'
        ]);
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', [
            'checkCacheForProfileByUsername',
            'getProfileByUsername',
            'getUserProfile'
        ]);
        translateServiceSpy = jasmine.createSpyObj<TranslateService>('TranslateService', ['instant']);
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
        adalService.userInfo.userName = adminProfile.username;

        profileServiceSpy.checkCacheForProfileByUsername.and.callFake(() => null);
        profileServiceSpy.getProfileByUsername.and.returnValue(Promise.resolve(judgeProfile));
        videoWebServiceSpy.getConferenceChatHistory.and.returnValue(Promise.resolve(chatHistory));
        videoWebServiceSpy.getCurrentParticipant.and.returnValue(Promise.resolve(loggedParticipant));

        profileServiceSpy.getUserProfile.and.resolveTo(adminProfile);

        component = new VhoChatComponent(
            videoWebServiceSpy,
            profileServiceSpy,
            eventsService,
            new MockLogger(),
            adalService,
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

    it('should use participant name when message is not from admin', async () => {
        const judgeUsername = hearing.judge.id;
        const adminUsername = 'admin@hmcts.net';
        adalService.userInfo.userName = judgeUsername;
        const instantMessage = new InstantMessage({
            conferenceId: conference.id,
            id: Guid.create().toString(),
            from: judgeUsername,
            to: adminUsername,
            message: 'test message',
            timestamp: new Date()
        });
        profileServiceSpy.checkCacheForProfileByUsername.and.returnValue(judgeProfile);
        const result = await component.verifySender(instantMessage);
        expect(result.from_display_name).toEqual(hearing.judge.displayName);
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
        adalService.userInfo.userName = adminUsername;
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
        adalService.userInfo.userName = adminUsername;
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
        adalService.userInfo.userName = adminUsername;
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
