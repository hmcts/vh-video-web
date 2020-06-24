import { VhoRaiseConsultationComponent } from './vho-raise-consultation.component';

describe('VhoRaiseConsultationComponent', () => {
    let component: VhoRaiseConsultationComponent;

    beforeEach(() => {
        component = new VhoRaiseConsultationComponent();
    });

    it('should emit call accepted', () => {
        spyOn(component.acceptedVhoCall, 'emit');
        component.acceptVhoConsultationRequest();
        expect(component.acceptedVhoCall.emit).toHaveBeenCalled();
    });
});
