import { ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ParticipantStatusComponent } from './participant-status.component';
import { Participant } from 'src/app/shared/models/participant';
import { VideoWebService } from '../../services/api/video-web.service';
import { ErrorService } from '../../services/error.service';
import { MockLogger } from '../../testing/mocks/MockLogger';
import { EventsService } from '../../services/events.service';
import { ParticipantStatusReader } from '../../shared/models/participant-status-reader';
import { MockEventsService } from '../../testing/mocks/MockEventService';
import { of } from 'rxjs';
import { VhoHearingsComponent } from '../hearings/vho-hearings.component';
import { TestFixtureHelper } from '../../testing/Helper/test-fixture-helper';
import { ParticipantContactDetails } from '../../shared/models/participant-contact-details';
import { ParticipantStatusMessage } from '../../services/models/participant-status-message';

describe('ParticipantStatusComponent', () => {
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    let eventsService: jasmine.SpyObj<EventsService>;
    let participantStatusReaderSpy: jasmine.SpyObj<ParticipantStatusReader>;
    const mockEventService = new MockEventsService();
    const testData = new ConferenceTestData();
    const participants = new ConferenceTestData().getListOParticipantContactDetailsResponseVho(
        '174DFEFB-8EF2-4093-801D-621DF852021D',
        'MyVenue'
    );
    let component: ParticipantStatusComponent;

    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
        'getParticipantsWithContactDetailsByConferenceId',
        'raiseSelfTestFailureEvent'
    ]);
    errorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', [
        'goToServiceError',
        'handleApiError',
        'returnHomeIfUnauthorised'
    ]);

    eventsService = jasmine.createSpyObj<EventsService>('EventsService', ['getParticipantStatusMessage', 'getServiceReconnected']);
    eventsService.getParticipantStatusMessage.and.returnValue(mockEventService.participantStatusSubject.asObservable());
    eventsService.getServiceReconnected.and.returnValue(mockEventService.eventHubReconnectSubject.asObservable());

    participantStatusReaderSpy = jasmine.createSpyObj<ParticipantStatusReader>('ParticipantStatusReader', [
        'getStatusAsText',
        'getStatusAsTextForJudge'
    ]);

    beforeEach(() => {
        videoWebServiceSpy.getParticipantsWithContactDetailsByConferenceId.and.returnValue(Promise.resolve(participants));

        component = new ParticipantStatusComponent(
            videoWebServiceSpy,
            errorServiceSpy,
            eventsService,
            new MockLogger(),
            participantStatusReaderSpy
        );
    });

    it('should initalise data', async () => {
        await component.ngOnInit();
        expect(component.participants).not.toBeNull();
        expect(component.participants.length).toBe(4);
        expect(component.loadingData).toBeFalsy();
    });

    it('should return loadData', async () => {
        await component.loadData();
        expect(component.participants).not.toBeNull();
        expect(component.participants.length).toBe(4);
        expect(component.loadingData).toBeFalsy();
    });

    it('should handle error when get api fails', async () => {
        const error = { error: 'unable to reach api' };
        videoWebServiceSpy.getParticipantsWithContactDetailsByConferenceId.and.callFake(() => Promise.reject(error));
        await component.getParticipantsByConference(testData.getConferenceDetailNow().id);
        expect(errorServiceSpy.handleApiError).toHaveBeenCalledWith(error);
    });

    it('should refresh data on eventhub disconnect', async () => {
        await component.setupEventHubSubscribers();
        mockEventService.eventHubDisconnectSubject.next(1);
        mockEventService.eventHubDisconnectSubject.next(2);
        mockEventService.eventHubDisconnectSubject.next(3);

        expect(videoWebServiceSpy.getParticipantsWithContactDetailsByConferenceId).toHaveBeenCalledTimes(3);
    });

    it('should not update participant status when participants null', () => {
        component.setupEventHubSubscribers();
        component.participants = null;
        const message = new ParticipantStatusMessage('', '', '', ParticipantStatus.None);

        mockEventService.participantStatusSubject.next(message);
    });

    it('should update participant status', () => {
        component.setupEventHubSubscribers();
        const conference = testData.getConferenceNow();
        component.participants = [new ParticipantContactDetails(participants[0])];
        component.participants[0].status = ParticipantStatus.NotSignedIn;
        const message = new ParticipantStatusMessage(
            component.participants[0].id,
            component.participants[0].username,
            conference.id,
            ParticipantStatus.Available
        );

        mockEventService.participantStatusSubject.next(message);

        expect(component.participants[0].status).toBe(message.status);
    });

    it('should update participant status when participant is different judge in different conference', () => {
        component.setupEventHubSubscribers();
        component.participants = [new ParticipantContactDetails(participants[2])];
        component.participants[0].status = ParticipantStatus.NotSignedIn;
        const message = new ParticipantStatusMessage(
            component.participants[0].id,
            'SomeJudge',
            '940B8034-34D4-4292-B6F0-4A5A928AF72C',
            ParticipantStatus.Available
        );

        mockEventService.participantStatusSubject.next(message);

        expect(component.participants[0].status).toBe(ParticipantStatus.Available);
    });

    it('should update participant status when participant same judge in different conference is in a hearing', () => {
        participantStatusReaderSpy.inAnotherHearingText = 'In another hearing';
        component.setupEventHubSubscribers();
        const judge1 = participants[2];
        const judge1InAnotherHearing = participants[3];
        component.participants = [new ParticipantContactDetails(judge1)];
        component.participants[0].status = ParticipantStatus.Disconnected;
        const message = new ParticipantStatusMessage(
            judge1InAnotherHearing.id,
            judge1InAnotherHearing.username,
            judge1InAnotherHearing.conference_id,
            ParticipantStatus.InHearing
        );

        mockEventService.participantStatusSubject.next(message);

        expect(component.participants[0].status).toBe(ParticipantStatus.Disconnected);
        expect(component.participants[0].statusText).toBe('In another hearing');
    });

    it('should update participant status when participant same judge is not in different hearing', () => {
        participantStatusReaderSpy.getStatusAsTextForJudge.and.returnValue('Unavailable');
        component.setupEventHubSubscribers();
        const judge1 = participants[2];
        const judge1InAnotherHearing = participants[3];
        component.participants = [new ParticipantContactDetails(judge1)];
        component.participants[0].status = ParticipantStatus.NotSignedIn;
        const message = new ParticipantStatusMessage(
            judge1InAnotherHearing.id,
            judge1InAnotherHearing.username,
            judge1InAnotherHearing.conference_id,
            ParticipantStatus.InConsultation
        );

        mockEventService.participantStatusSubject.next(message);

        expect(component.participants[0].status).toBe(ParticipantStatus.NotSignedIn);
        expect(component.participants[0].statusText).toBe('Unavailable');
    });

    it('should return "available" class', () => {
        const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
        p.status = ParticipantStatus.Available;
        const participant = new Participant(p);
        expect(component.getParticipantStatusClass(participant.status)).toBe('participant-available');
    });

    it('should return "not signed in" class', () => {
        const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
        p.status = ParticipantStatus.None;
        let participant = new Participant(p);

        expect(component.getParticipantStatusClass(participant.status)).toBe('participant-not-signed-in');

        p.status = ParticipantStatus.NotSignedIn;
        participant = new Participant(p);
        expect(component.getParticipantStatusClass(participant.status)).toBe('participant-not-signed-in');
    });

    it('should return "disconnected" class', () => {
        const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
        p.status = ParticipantStatus.Disconnected;
        const participant = new Participant(p);

        expect(component.getParticipantStatusClass(participant.status)).toBe('participant-disconnected');
    });

    it('should return "default" class', () => {
        const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
        p.status = ParticipantStatus.InConsultation;
        let participant = new Participant(p);

        expect(component.getParticipantStatusClass(participant.status)).toBe('participant-default-status');

        p.status = ParticipantStatus.UnableToJoin;
        participant = new Participant(p);
        expect(component.getParticipantStatusClass(participant.status)).toBe('participant-default-status');

        p.status = ParticipantStatus.InHearing;
        participant = new Participant(p);
        expect(component.getParticipantStatusClass(participant.status)).toBe('participant-default-status');

        p.status = ParticipantStatus.Joining;
        participant = new Participant(p);
        expect(component.getParticipantStatusClass(participant.status)).toBe('participant-default-status');
    });
    it('should set venue name', () => {
        component.hearingVenueName = 'venue';
        expect(component.hearingVenueName).toBe('venue');
    });
});
