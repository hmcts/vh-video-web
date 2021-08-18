import { VideoWebService } from 'src/app/services/api/video-web.service';
import { UnreadAdminMessageResponse } from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { Hearing } from '../../shared/models/hearing';
import { UnreadMessagesParticipantComponent } from './unread-messages-participant.component';
import { fakeAsync, tick } from '@angular/core/testing';
import { Participant } from 'src/app/shared/models/participant';
import { ConferenceMessageAnswered } from 'src/app/services/models/conference-message-answered';
import { Guid } from 'guid-typescript';
import { InstantMessage } from 'src/app/services/models/instant-message';
import { adminAnsweredChatSubjectMock, eventsServiceSpy, messageSubjectMock } from 'src/app/testing/mocks/mock-events-service';

describe('UnreadMessagesParticipantComponent', () => {
    let component: UnreadMessagesParticipantComponent;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    const conference = new ConferenceTestData().getConferenceDetailNow();
    const participant = conference.participants[0];
    let logger: MockLogger;

    let unreadMessageResponse: UnreadAdminMessageResponse;

    beforeAll(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getUnreadMessagesForParticipant']);

        logger = new MockLogger();
    });

    beforeEach(() => {
        unreadMessageResponse = new UnreadAdminMessageResponse({
            number_of_unread_messages: 5,
            participant_id: participant.id
        });
        videoWebServiceSpy.getUnreadMessagesForParticipant.and.callFake(() => Promise.resolve(unreadMessageResponse));

        component = new UnreadMessagesParticipantComponent(videoWebServiceSpy, eventsServiceSpy, logger);
        component.unreadMessages = unreadMessageResponse;
        component.hearing = new Hearing(conference);
        component.participant = new Participant(participant);
    });

    afterAll(() => {
        try {
            component.ngOnDestroy();
        } catch (error) {
            console.error(error);
        }
    });

    it('should init unread message count', fakeAsync(() => {
        const expectedCount = 5;
        component.unreadMessages = undefined;
        component.ngOnInit();
        tick();
        expect(component.unreadCount).toBe(expectedCount);
    }));

    it('should return zero when unread message is not set', () => {
        component.unreadMessages = undefined;

        expect(component.unreadCount).toBe(0);
        expect(component.getIMStatus()).toBe('IM-empty.png');
    });

    it('should log error when unable to init', fakeAsync(() => {
        const error = new Error('failed to find conference');
        videoWebServiceSpy.getUnreadMessagesForParticipant.and.callFake(() => Promise.reject(error));
        const spy = spyOn(logger, 'error');
        component.ngOnInit();
        tick();
        expect(spy.calls.mostRecent().args[0]).toMatch(`Failed to get unread vho messages for`);
        expect(spy.calls.mostRecent().args[1]).toBe(error);
    }));

    it('should reset conference unread counter when vho sends a message', () => {
        const conferenceId = conference.id;
        const participantId = participant.id;
        const expectedCount = 0;
        component.resetUnreadCounter(conferenceId, participantId);
        expect(component.unreadCount).toBe(expectedCount);
    });

    it('should reset unread message counter when admin has answered', () => {
        const conferenceId = conference.id;
        const participantId = participant.id;
        const expectedCount = 0;
        component.setupSubscribers();
        const payload = new ConferenceMessageAnswered(conferenceId, participantId);

        adminAnsweredChatSubjectMock.next(payload);

        expect(component.unreadCount).toBe(expectedCount);
    });

    it('should not reset unread message counter message is for another conference', () => {
        const conferenceId = Guid.create().toString();
        const participantId = participant.id;
        const expectedCount = 5;
        component.setupSubscribers();
        const payload = new ConferenceMessageAnswered(conferenceId, participantId);

        adminAnsweredChatSubjectMock.next(payload);

        expect(component.unreadCount).toBe(expectedCount);
    });

    it('should return IM image if are unread messages', () => {
        component.unreadMessages = new UnreadAdminMessageResponse({ participant_id: '1111-1111', number_of_unread_messages: 5 });
        expect(component.getIMStatus()).toBe('IM_icon.png');
    });

    it('should return empty image if there are no unread messages', () => {
        component.unreadMessages = new UnreadAdminMessageResponse({ participant_id: '1111-1111', number_of_unread_messages: 0 });
        expect(component.getIMStatus()).toBe('IM-empty.png');
    });

    it('should increase unread count when participant sends a message', () => {
        const conferenceId = conference.id;
        const participantId = conference.participants[0].id;
        const expectedCount = component.unreadCount + 1;
        component.setupSubscribers();
        messageSubjectMock.next(
            new InstantMessage({
                conferenceId,
                from: participantId
            })
        );
        expect(component.unreadCount).toBe(expectedCount);
    });

    it('should not increase unread count when admin sends a message', () => {
        const conferenceId = conference.id;
        const participantUsername = 'admin@hmcts.net';
        const expectedCount = component.unreadCount;
        component.setupSubscribers();
        messageSubjectMock.next(
            new InstantMessage({
                conferenceId,
                from: participantUsername
            })
        );
        expect(component.unreadCount).toBe(expectedCount);
    });

    it('should not increase unread count when message is for a different conference', () => {
        const conferenceId = Guid.create().toString();
        const participantId = conference.participants[0].id;
        const expectedCount = component.unreadCount;
        component.incrementUnreadCounter(conferenceId, participantId);
        expect(component.unreadCount).toBe(expectedCount);
    });

    it('should not increase unread count when message is for participant not in conference', () => {
        const conferenceId = conference.id;
        const participantUsername = 'random@hmcts.net';
        const expectedCount = component.unreadCount;
        component.setupSubscribers();
        messageSubjectMock.next(
            new InstantMessage({
                conferenceId,
                from: participantUsername
            })
        );
        expect(component.unreadCount).toBe(expectedCount);
    });
});
