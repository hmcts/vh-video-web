import { ConsultationAnswer, Role } from 'src/app/services/clients/api-client';
import { Participant } from 'src/app/shared/models/participant';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ReceiveConsultationComponent } from './receive-consultation.component';

describe('ReceiveConsultationComponent', () => {
    let component: ReceiveConsultationComponent;
    const testPat = new ConferenceTestData().getConferenceDetailNow().participants.filter(x => x.role !== Role.Judge)[0];
    let testParticipant: Participant;

    beforeEach(() => {
        testParticipant = new Participant(testPat);
        component = new ReceiveConsultationComponent();
        component.consultationRequester = testParticipant;
    });

    it('should return input requester full name', () => {
        expect(component.requesterName).toEqual(testParticipant.fullName);
    });

    it('should emit call accepted', () => {
        spyOn(component.respondedToConsulation, 'emit');
        component.acceptConsultationRequest();
        expect(component.respondedToConsulation.emit).toHaveBeenCalledWith(ConsultationAnswer.Accepted);
    });

    it('should emit call rejected', () => {
        spyOn(component.respondedToConsulation, 'emit');
        component.rejectConsultationRequest();
        expect(component.respondedToConsulation.emit).toHaveBeenCalledWith(ConsultationAnswer.Rejected);
    });
});
