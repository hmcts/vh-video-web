import { ConferenceResponseVho } from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { AdminImComponent } from './admin-im.component';

describe('AdminImComponent', () => {
    let component: AdminImComponent;
    let conference: ConferenceResponseVho;

    beforeEach(() => {
        conference = new ConferenceTestData().getConferenceDetailNow();
        component = new AdminImComponent();
        component.hearing = new Hearing(conference);
    });

    it('should update current participan on select', () => {
        component.currentParticipant = null;
        const participant = component.hearing.participants[0];

        component.onParticipantSelected(participant);

        expect(component.currentParticipant).toBe(participant);
    });
});
