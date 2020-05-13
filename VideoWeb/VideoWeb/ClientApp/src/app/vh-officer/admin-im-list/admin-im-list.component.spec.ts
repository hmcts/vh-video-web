import { ConferenceResponseVho } from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { AdminImListComponent } from './admin-im-list.component';

describe('AdminImListComponent', () => {
    let component: AdminImListComponent;
    let conference: ConferenceResponseVho;
    let hearing: Hearing;

    beforeEach(() => {
        conference = new ConferenceTestData().getConferenceDetailNow();
        component = new AdminImListComponent();
        hearing = new Hearing(conference);
        component.hearing = hearing;
    });

    it('should populate list of participants to IM on init', () => {
        component.ngOnInit();
        expect(component.imParticipants.length).toBe(1);
    });

    it('should return false when current participant is not set', () => {
        const participant = hearing.participants[0];
        component.currentParticipant = null;
        expect(component.isCurrentParticipant(participant)).toBeFalsy();
    });

    it('should return false when participant is not the same as current', () => {
        const participant = hearing.participants[0];
        component.currentParticipant = hearing.participants[1];
        expect(component.isCurrentParticipant(participant)).toBeFalsy();
    });

    it('should return true when participant is the same as current', () => {
        const participant = hearing.participants[0];
        component.currentParticipant = participant;
        expect(component.isCurrentParticipant(participant)).toBeTruthy();
    });

    it('should update and emit selected participant on select', () => {
        component.currentParticipant = null;
        spyOn(component.selectedParticipant, 'emit');
        const participant = hearing.participants[0];

        component.selectParticipant(participant);

        expect(component.currentParticipant).toBe(participant);
        expect(component.selectedParticipant.emit).toHaveBeenCalledWith(participant);
    });
});
