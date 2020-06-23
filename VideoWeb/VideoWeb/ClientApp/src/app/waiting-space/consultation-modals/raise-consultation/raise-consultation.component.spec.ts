import { Role } from 'src/app/services/clients/api-client';
import { Participant } from 'src/app/shared/models/participant';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { RaiseConsultationComponent } from './raise-consultation.component';

describe('RaiseConsultationComponent', () => {
    let component: RaiseConsultationComponent;
    const testPat = new ConferenceTestData().getConferenceDetailNow().participants.filter(x => x.role !== Role.Judge)[0];
    let testParticipant: Participant;

    beforeEach(() => {
        testParticipant = new Participant(testPat);
        component = new RaiseConsultationComponent();
        component.consultationRequestee = testParticipant;
    });

    it('should return input requestee full name', () => {
        expect(component.requesteeName).toEqual(testParticipant.fullName);
    });

    it('should emit call cancelled', () => {
        spyOn(component.cancelledRequest, 'emit');
        component.cancelConsultationRequest();
        expect(component.cancelledRequest.emit).toHaveBeenCalled();
    });
});
