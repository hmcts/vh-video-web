import { vhContactDetails } from '../contact-information';
import { ContactUsComponent } from './contact-us.component';

describe('ContactUsComponent', () => {
    let component: ContactUsComponent;

    beforeEach(() => {
        component = new ContactUsComponent();
    });

    it('should init contact details', () => {
        expect(component.contact.phone).toBe(vhContactDetails.englandAndWales.phoneNumber);
        expect(component.contact.email).toBe(vhContactDetails.englandAndWales.email);
    });
});
