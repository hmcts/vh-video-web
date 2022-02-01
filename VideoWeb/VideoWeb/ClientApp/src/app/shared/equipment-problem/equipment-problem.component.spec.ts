import { vhContactDetails } from '../contact-information';
import { EquipmentProblemComponent } from './equipment-problem.component';

describe('EquipmentProblemComponent', () => {
    let component: EquipmentProblemComponent;

    beforeEach(() => {
        component = new EquipmentProblemComponent();
    });

    it('should have contact details information', () => {
        expect(component.contactDetails).toBeDefined();
        expect(component.contactDetails.scotland.email).toBe(vhContactDetails.scotland.email);
        expect(component.contactDetails.scotland.phoneNumber).toBe(vhContactDetails.scotland.phoneNumber);
        expect(component.contactDetails.englandAndWales.email).toEqual(vhContactDetails.englandAndWales.email);
        expect(component.contactDetails.englandAndWales.phoneNumber).toEqual(vhContactDetails.englandAndWales.phoneNumber);
    });
});
