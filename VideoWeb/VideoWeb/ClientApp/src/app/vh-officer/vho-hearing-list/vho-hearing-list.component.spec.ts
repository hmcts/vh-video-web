import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { HearingSummary } from '../../shared/models/hearing-summary';
import { VhoHearingListComponent } from './vho-hearing-list.component';

describe('VhoHearingListComponent', () => {
    let component: VhoHearingListComponent;

    beforeEach(() => {
        component = new VhoHearingListComponent();
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

    it('should emit conference selected', () => {
        component.currentConference = null;
        spyOn(component.selectedConference, 'emit');
        const conference = component.conferences[0];
        component.selectConference(conference);
        expect(component.selectedConference.emit).toHaveBeenCalledWith(conference);
        expect(component.currentConference).toBe(conference);
    });

    it('should get duration as text', () => {
        const conference = new ConferenceTestData().getConferenceFuture();
        conference.scheduled_duration = 10;
        const hearing = new HearingSummary(conference);
        expect(component.getDuration(hearing)).toBe('10m');
    });

    it('should get participants for conference', () => {
        const conference = new ConferenceTestData().getConferenceFuture();
        const participants = conference.participants;
        const hearing = new HearingSummary(conference);
        expect(component.getParticipantsForConference(hearing).length).toEqual(participants.length);
    });

    it('should map summary to full dto', () => {
        const conference = new ConferenceTestData().getConferenceFuture();
        const summary = new HearingSummary(conference);

        const result = component.mapToHearing(summary);

        expect(result).toBeDefined();
        expect(result.scheduledStartTime).toEqual(summary.scheduledDateTime);
        expect(result.status).toEqual(summary.status);
    });
    it('should map summary to full dto with participants', () => {
        const conference = new ConferenceTestData().getConferenceFuture();
        const summary = new HearingSummary(conference);

        const result = component.mapToHearingWithParticipants(summary);

        expect(result).toBeDefined();
        expect(result.scheduledStartTime).toEqual(summary.scheduledDateTime);
        expect(result.status).toEqual(summary.status);
        expect(result.participants.length).toBeGreaterThan(0);
    });
});
