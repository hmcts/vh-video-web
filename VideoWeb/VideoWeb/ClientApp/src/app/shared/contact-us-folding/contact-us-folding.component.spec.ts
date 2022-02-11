import { vhContactDetails } from 'src/app/shared/contact-information';
import { ContactUsFoldingComponent } from './contact-us-folding.component';

describe('ContactUsFoldingComponent', () => {
    let component: ContactUsFoldingComponent;

    beforeEach(() => {
        component = new ContactUsFoldingComponent();
    });

    it('should init contact details', () => {
        expect(component.contactDetails.englandAndWales.phoneNumber).toBe(vhContactDetails.englandAndWales.phoneNumber);
        expect(component.contactDetails.scotland.phoneNumber).toBe(vhContactDetails.scotland.phoneNumber);
        expect(component.contactDetails.englandAndWales.email).toBe(vhContactDetails.englandAndWales.email);
        expect(component.contactDetails.scotland.email).toBe(vhContactDetails.scotland.email);
    });

    it('should toggle visbility', () => {
        component.expanded = true;
        component.toggle();
        expect(component.expanded).toBeFalsy();
    });
});
