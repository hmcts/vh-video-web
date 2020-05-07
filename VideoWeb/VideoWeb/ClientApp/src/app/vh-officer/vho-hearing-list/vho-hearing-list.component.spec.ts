import { ClipboardService } from 'ngx-clipboard';
import { ConferenceStatus, ParticipantForUserResponse } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { HearingSummary } from '../../shared/models/hearing-summary';
import { ParticipantSummary } from '../../shared/models/participant-summary';
import { VhoHearingListComponent } from './vho-hearing-list.component';

describe('VhoHearingListComponent', () => {
    let component: VhoHearingListComponent;
    let clipboardServiceSpy: jasmine.SpyObj<ClipboardService>;

    beforeAll(() => {
        clipboardServiceSpy = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copyFromContent']);
    });

    beforeEach(() => {
        component = new VhoHearingListComponent(clipboardServiceSpy);
        component.conferences = new ConferenceTestData().getVhoTestData().map(c => new HearingSummary(c));
    });

    it('should return true if current conference is the same one selected', () => {
        component.currentConference = component.conferences[0];
        expect(component.isCurrentConference(component.conferences[0])).toBeTruthy();
    });

    it('should return false if current conference is not the same one selected', () => {
        component.currentConference = component.conferences[1];
        expect(component.isCurrentConference(component.conferences[0])).toBeFalsy();
    });

    it('should return false if current conference is null', () => {
        component.currentConference = null;
        expect(component.isCurrentConference(component.conferences[0])).toBeFalsy();
    });

    const conferenceStatusTextTestCases = [
        { status: ConferenceStatus.NotStarted, expected: 'Not Started' },
        { status: ConferenceStatus.InSession, expected: 'In Session' },
        { status: ConferenceStatus.Paused, expected: 'Paused' },
        { status: ConferenceStatus.Suspended, expected: 'Suspended' },
        { status: ConferenceStatus.Closed, expected: 'Closed' }
    ];

    conferenceStatusTextTestCases.forEach(test => {
        it(`should return ${test.expected} when conference status is ${test.status}`, () => {
            const conference = new ConferenceTestData().getConferenceFuture();
            conference.status = test.status;
            expect(component.getConferenceStatusText(new HearingSummary(conference))).toBe(test.expected);
        });
    });

    it('should get `Delayed` conference status text', () => {
        const conference = new ConferenceTestData().getVHOConferencePast();
        conference.status = ConferenceStatus.NotStarted;
        expect(component.getConferenceStatusText(new HearingSummary(conference))).toBe('Delayed');
    });

    it('should emit conference selected', () => {
        component.currentConference = null;
        spyOn(component.selectedConference, 'emit');
        const conference = component.conferences[0];
        component.selectConference(conference);
        expect(component.selectedConference.emit).toHaveBeenCalledWith(conference);
        expect(component.currentConference).toBe(conference);
    });

    it('should set configuration for scrollbar to suppress scroll x', () => {
        expect(component.scrollConfig.suppressScrollX).toBe(true);
    });

    it('should return true when conference is suspended', () => {
        const conference = new ConferenceTestData().getConferenceFuture();
        conference.status = ConferenceStatus.Suspended;
        const hearing = new HearingSummary(conference);
        expect(component.isSuspended(hearing)).toBeTruthy();
    });

    it('should return false when conference is not suspended', () => {
        const conference = new ConferenceTestData().getConferenceFuture();
        conference.status = ConferenceStatus.Paused;
        const hearing = new HearingSummary(conference);
        expect(component.isSuspended(hearing)).toBeFalsy();
    });

    it('should return true when conference is on time', () => {
        const conference = new ConferenceTestData().getConferenceFuture();
        conference.status = ConferenceStatus.NotStarted;
        const hearing = new HearingSummary(conference);
        expect(component.isOnTime(hearing)).toBeTruthy();
    });

    it('should return false when conference is not on time', () => {
        const conference = new ConferenceTestData().getConferencePast();
        conference.status = ConferenceStatus.NotStarted;
        const hearing = new HearingSummary(conference);
        expect(component.isOnTime(hearing)).toBeFalsy();
    });

    it('should return true when conference is delayed', () => {
        const conference = new ConferenceTestData().getConferencePast();
        conference.status = ConferenceStatus.NotStarted;
        const hearing = new HearingSummary(conference);
        expect(component.isDelayed(hearing)).toBeTruthy();
    });

    it('should return false when conference is not delayed', () => {
        const conference = new ConferenceTestData().getConferenceNow();
        conference.status = ConferenceStatus.NotStarted;
        const hearing = new HearingSummary(conference);
        expect(component.isDelayed(hearing)).toBeFalsy();
    });

    it('should return true when conference is paused', () => {
        const conference = new ConferenceTestData().getConferenceFuture();
        conference.status = ConferenceStatus.Paused;
        const hearing = new HearingSummary(conference);
        expect(component.isPaused(hearing)).toBeTruthy();
    });

    it('should return false when conference is not paused', () => {
        const conference = new ConferenceTestData().getConferenceFuture();
        conference.status = ConferenceStatus.InSession;
        const hearing = new HearingSummary(conference);
        expect(component.isPaused(hearing)).toBeFalsy();
    });

    it('should return true when conference is in session', () => {
        const conference = new ConferenceTestData().getConferenceFuture();
        conference.status = ConferenceStatus.InSession;
        const hearing = new HearingSummary(conference);
        expect(component.isInSession(hearing)).toBeTruthy();
    });

    it('should return false when conference is not in session', () => {
        const conference = new ConferenceTestData().getConferenceFuture();
        conference.status = ConferenceStatus.Paused;
        const hearing = new HearingSummary(conference);
        expect(component.isInSession(hearing)).toBeFalsy();
    });

    it('should return true when conference is closed', () => {
        const conference = new ConferenceTestData().getConferenceFuture();
        conference.status = ConferenceStatus.Closed;
        const hearing = new HearingSummary(conference);
        expect(component.isClosed(hearing)).toBeTruthy();
    });

    it('should return false when conference is not closed', () => {
        const conference = new ConferenceTestData().getConferenceFuture();
        conference.status = ConferenceStatus.Paused;
        const hearing = new HearingSummary(conference);
        expect(component.isClosed(hearing)).toBeFalsy();
    });

    it('should get duration as text', () => {
        const conference = new ConferenceTestData().getConferenceFuture();
        conference.scheduled_duration = 10;
        const hearing = new HearingSummary(conference);
        expect(component.getDuration(hearing)).toBe('10 minutes');
    });

    it('should get participants for conference', () => {
        const conference = new ConferenceTestData().getConferenceFuture();
        const participants = conference.participants;
        const hearing = new HearingSummary(conference);
        expect(component.getParticipantsForConference(hearing).length).toEqual(participants.length);
    });

    it('expect clipboard to copy conference id', () => {
        const conference = new ConferenceTestData().getConferenceFuture();
        const hearing = new HearingSummary(conference);
        component.copyToClipboard(hearing);
        expect(clipboardServiceSpy.copyFromContent).toHaveBeenCalledWith(conference.id);
    });
});
