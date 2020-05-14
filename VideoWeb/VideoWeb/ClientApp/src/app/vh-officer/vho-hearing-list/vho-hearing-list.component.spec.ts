import { ClipboardService } from 'ngx-clipboard';
import { ConferenceStatus } from 'src/app/services/clients/api-client';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { HearingSummary } from '../../shared/models/hearing-summary';
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
