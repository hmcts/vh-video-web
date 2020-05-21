import { vhContactDetails } from '../contact-information';
import { ContactUsComponent } from './contact-us.component';

describe('ContactUsComponent', () => {
    let component: ContactUsComponent;

    beforeEach(() => {
        component = new ContactUsComponent();
    });

    it('should init contact details', () => {
        expect(component.contact.phone).toBe(vhContactDetails.phone);
        expect(component.contact.email).toBe(vhContactDetails.adminEmail);
    });
});
