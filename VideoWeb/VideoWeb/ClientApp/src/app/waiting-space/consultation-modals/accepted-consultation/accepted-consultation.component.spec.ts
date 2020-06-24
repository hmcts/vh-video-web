import { Role } from 'src/app/services/clients/api-client';
import { Participant } from 'src/app/shared/models/participant';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { AcceptedConsultationComponent } from './accepted-consultation.component';

describe('AcceptedConsultationComponent', () => {
    let component: AcceptedConsultationComponent;
    const testPat = new ConferenceTestData().getConferenceDetailNow().participants.filter(x => x.role !== Role.Judge)[0];
    let testParticipant: Participant;

    beforeEach(() => {
        testParticipant = new Participant(testPat);
        component = new AcceptedConsultationComponent();
        component.consultationRequestee = testParticipant;
    });

    it('should return input requestee full name', () => {
        expect(component.requesteeName).toEqual(testParticipant.fullName);
    });
});
