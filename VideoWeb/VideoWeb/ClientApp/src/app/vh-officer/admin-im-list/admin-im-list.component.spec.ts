import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ConferenceResponseVho,
    ParticipantContactDetailsResponseVho,
    ParticipantResponse,
    ParticipantStatus,
    Role
} from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { Hearing } from 'src/app/shared/models/hearing';
import { Participant } from 'src/app/shared/models/participant';
import { ParticipantContactDetails } from 'src/app/shared/models/participant-contact-details';
import { ParticipantStatusReader } from 'src/app/shared/models/participant-status-reader';
import { ParticipantsUpdatedMessage } from 'src/app/shared/models/participants-updated-message';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import {
    eventHubDisconnectSubjectMock,
    eventsServiceSpy,
    getParticipantsUpdatedSubjectMock,
    participantStatusSubjectMock
} from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { AdminImListComponent } from './admin-im-list.component';

describe('AdminImListComponent', () => {
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    const eventsService = eventsServiceSpy;
    let participantStatusReaderSpy: jasmine.SpyObj<ParticipantStatusReader>;
    const testData = new ConferenceTestData();
    const hostRoles = [Role.Judge, Role.StaffMember];
    let participants: ParticipantContactDetailsResponseVho[];
    let component: AdminImListComponent;
    let conference: ConferenceResponseVho;
    let hearing: Hearing;

    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
        'getParticipantsWithContactDetailsByConferenceId',
        'raiseSelfTestFailureEvent'
    ]);
    errorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', [
        'goToServiceError',
        'handleApiError',
        'returnHomeIfUnauthorised'
    ]);

    participantStatusReaderSpy = jasmine.createSpyObj<ParticipantStatusReader>(
        'ParticipantStatusReader',
        ['getStatusAsText', 'getStatusAsTextForHost'],
        { inAnotherHearingText: 'In Another Hearing' }
    );

    beforeEach(() => {
        participants = new ConferenceTestData().getListOParticipantContactDetailsResponseVho(
            '174DFEFB-8EF2-4093-801D-621DF852021D',
            'MyVenue'
        );
        videoWebServiceSpy.getParticipantsWithContactDetailsByConferenceId.and.returnValue(Promise.resolve(participants));

        component = new AdminImListComponent(
            videoWebServiceSpy,
            eventsService,
            participantStatusReaderSpy,
            errorServiceSpy,
            new MockLogger()
        );
        conference = new ConferenceTestData().getConferenceDetailNow();
        hearing = new Hearing(conference);
        component.hearing = hearing;
    });

    it('should initalise data', fakeAsync(() => {
        component.ngOnInit();
        flushMicrotasks();
        expect(component.participants).not.toBeNull();
        expect(component.participants.length).toBe(4);
        expect(component.loadingData).toBeFalsy();
    }));

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
        eventHubDisconnectSubjectMock.next(1);
        eventHubDisconnectSubjectMock.next(2);
        eventHubDisconnectSubjectMock.next(3);

        expect(videoWebServiceSpy.getParticipantsWithContactDetailsByConferenceId).toHaveBeenCalledTimes(3);
    });

    it('should not update participant status when participants null', () => {
        spyOn(component, 'setParticipantStatus');

        component.setupEventHubSubscribers();
        component.participants = null;
        const message = new ParticipantStatusMessage('', '', '', ParticipantStatus.None);

        participantStatusSubjectMock.next(message);

        expect(component.setParticipantStatus).toHaveBeenCalledTimes(0);
    });

    it('should update participant status', () => {
        component.setupEventHubSubscribers();
        const currentconference = testData.getConferenceNow();
        component.participants = [new ParticipantContactDetails(participants[0])];
        component.participants[0].status = ParticipantStatus.NotSignedIn;
        const message = new ParticipantStatusMessage(
            component.participants[0].id,
            component.participants[0].username,
            currentconference.id,
            ParticipantStatus.Available
        );

        participantStatusSubjectMock.next(message);

        expect(component.participants[0].status).toBe(message.status);
    });

    it('should update participant status when participant same judge in different conference is in a hearing', () => {
        const inAnotherHearingText = 'In Another Hearing';
        participantStatusReaderSpy.inAnotherHearingText = inAnotherHearingText;
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

        participantStatusSubjectMock.next(message);

        expect(component.participants[0].status).toBe(ParticipantStatus.Disconnected);
        expect(component.participants[0].statusText).toBe(inAnotherHearingText);
    });

    describe('participantsUpdated', () => {
        const conferenceId = 'conferenceId';
        beforeEach(() => {
            component.conferenceId = conferenceId;
            spyOn(component, 'loadData');
        });

        it('should update participants when participant added event occurs for current conference', () => {
            component.setupEventHubSubscribers();

            const message = new ParticipantsUpdatedMessage(conferenceId, [new ParticipantResponse()]);
            getParticipantsUpdatedSubjectMock.next(message);

            expect(component.loadData).toHaveBeenCalledTimes(1);
        });

        it('should not update participants when participant added event occurs for another conference', () => {
            const otherConferenceId = 'otherConferenceId';
            component.setupEventHubSubscribers();

            const message = new ParticipantsUpdatedMessage(otherConferenceId, [new ParticipantResponse()]);
            getParticipantsUpdatedSubjectMock.next(message);

            expect(component.loadData).toHaveBeenCalledTimes(0);
        });
    });

    it('should return "available" class', () => {
        const p = new ConferenceTestData().getConferenceDetailFuture().participants[0];
        p.status = ParticipantStatus.Available;
        const participant = new Participant(p);
        expect(component.getParticipantStatusClass(participant.status)).toBe('participant-available');
    });

    xit('should populate list of participants to IM on init', () => {
        component.ngOnInit();
        expect(component.participants.length).toBe(hearing.participants.length);
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

        p.status = ParticipantStatus.InHearing;
        participant = new Participant(p);
        expect(component.getParticipantStatusClass(participant.status)).toBe('participant-default-status');

        p.status = ParticipantStatus.Joining;
        participant = new Participant(p);
        expect(component.getParticipantStatusClass(participant.status)).toBe('participant-default-status');
    });

    describe('setParticipantStatus', () => {
        hostRoles.forEach(role => {
            it(`should return "in another hearing text" if participant is a ${role}`, () => {
                const participant = participants[0];
                participant.role = role;
                participant.host_in_another_hearing = true;
                const participantContactDetails = new ParticipantContactDetails(participant);

                component.setParticipantStatus(ParticipantStatus.InHearing, participantContactDetails);

                expect(participantContactDetails.statusText).toBe(participantStatusReaderSpy.inAnotherHearingText);
            });
        });

        hostRoles.forEach(role => {
            it(`should get status for ${role} when not in a hearing`, () => {
                participantStatusReaderSpy.getStatusAsTextForHost.and.returnValue(participantStatusReaderSpy.unavailableText);
                const participant = participants[0];
                participant.role = role;
                participant.host_in_another_hearing = false;
                const participantContactDetails = new ParticipantContactDetails(participant);

                component.setParticipantStatus(ParticipantStatus.InHearing, participantContactDetails);

                expect(participantStatusReaderSpy.getStatusAsTextForHost).toHaveBeenCalled();
                expect(participantContactDetails.statusText).toBe(participantStatusReaderSpy.unavailableText);
            });
        });
    });

    const isParticipantAvailableTestCases = [
        { role: Role.Judge, status: ParticipantStatus.Available, expected: true },
        { role: Role.Judge, status: ParticipantStatus.InHearing, expected: true },
        { role: Role.Judge, status: ParticipantStatus.InConsultation, expected: false },
        { role: Role.Judge, status: ParticipantStatus.Disconnected, expected: false },
        { role: Role.Individual, status: ParticipantStatus.Available, expected: true },
        { role: Role.Individual, status: ParticipantStatus.InHearing, expected: false },
        { role: Role.Individual, status: ParticipantStatus.InConsultation, expected: false },
        { role: Role.Individual, status: ParticipantStatus.Disconnected, expected: false }
    ];

    isParticipantAvailableTestCases.forEach(test => {
        it(`should return availability as ${test.expected} when participant is ${test.role} and is ${test.status}`, () => {
            const participant = hearing.participants[0];
            participant.base.role = test.role;
            participant.base.status = test.status;
            expect(component.isParticipantAvailable(participant)).toBe(test.expected);
        });
    });
});
