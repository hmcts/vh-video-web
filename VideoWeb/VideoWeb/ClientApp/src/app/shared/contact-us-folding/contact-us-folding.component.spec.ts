import { vhContactDetails } from 'src/app/shared/contact-information';
import { ContactUsFoldingComponent } from './contact-us-folding.component';

describe('ContactUsFoldingComponent', () => {
    let component: ContactUsFoldingComponent;

    beforeEach(() => {
        component = new ContactUsFoldingComponent();
    });

    it('should init contact details', () => {
        expect(component.contact.phone).toBe(vhContactDetails.englandAndWales.phoneNumber);
        expect(component.contact.email).toBe(vhContactDetails.englandAndWales.email);
    });

    it('should toggle visbility', () => {
        component.expanded = true;
        component.toggle();
        expect(component.expanded).toBeFalsy();
    });
});
