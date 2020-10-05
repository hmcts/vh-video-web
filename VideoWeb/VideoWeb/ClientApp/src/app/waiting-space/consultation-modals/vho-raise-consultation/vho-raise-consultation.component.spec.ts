import { ConsultationAnswer } from 'src/app/services/clients/api-client';
import { VhoRaiseConsultationComponent } from './vho-raise-consultation.component';

describe('VhoRaiseConsultationComponent', () => {
    let component: VhoRaiseConsultationComponent;

    beforeEach(() => {
        component = new VhoRaiseConsultationComponent();
    });

    it('should emit call accepted', () => {
        spyOn(component.answeredVhoCall, 'emit');
        component.acceptVhoConsultationRequest();
        expect(component.answeredVhoCall.emit).toHaveBeenCalledWith(ConsultationAnswer.Accepted);
    });

    it('should emit call rejected', () => {
        spyOn(component.answeredVhoCall, 'emit');
        component.rejectVhoConsultationRequest();
        expect(component.answeredVhoCall.emit).toHaveBeenCalledWith(ConsultationAnswer.Rejected);
    });
});
